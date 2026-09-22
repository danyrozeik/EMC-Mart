import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { PayMerchantInput, RefundPaymentInput } from "@rti/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { IdempotencyService } from "../common/idempotency/idempotency.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { MerchantsService } from "../merchants/merchants.service";
import { PaymentOrchestrator } from "./payment-orchestrator";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: PaymentOrchestrator,
    private readonly idempotency: IdempotencyService,
    private readonly loyalty: LoyaltyService,
    private readonly merchants: MerchantsService,
    private readonly audit: AuditService,
  ) {}

  async pay(customerId: string, input: PayMerchantInput, idempotencyKey: string) {
    const { statusCode, body, replayed } = await this.idempotency.withIdempotency(
      idempotencyKey,
      "payments.pay",
      { customerId, ...input },
      () => this.executePayment(customerId, input, idempotencyKey),
    );

    return { ...body, replayed, statusCode };
  }

  private async executePayment(customerId: string, input: PayMerchantInput, idempotencyKey: string) {
    await this.merchants.getById(input.merchantId);

    let amountMinor = input.amountMinor;
    if (input.intentId) {
      const intent = await this.prisma.qrPaymentIntent.findUnique({ where: { id: input.intentId } });
      if (!intent || intent.status !== "OPEN") {
        throw new BadRequestException("QR payment intent is not available");
      }
      if (intent.expiresAt < new Date()) {
        throw new BadRequestException("QR payment intent has expired");
      }
      if (intent.merchantId !== input.merchantId || intent.amountMinor !== input.amountMinor) {
        throw new BadRequestException("Payment does not match the QR payment intent");
      }
      amountMinor = intent.amountMinor;
    }

    const providerResult = await this.orchestrator.pay({
      customerId,
      merchantId: input.merchantId,
      amountMinor,
      reference: input.reference,
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        type: "QR_PAYMENT",
        customerId,
        merchantId: input.merchantId,
        amountMinor,
        reference: input.reference,
        idempotencyKey,
        providerPaymentId: providerResult.providerPaymentId,
        status: providerResult.status === "SUCCEEDED" ? "COMPLETED" : "FAILED",
      },
    });

    if (input.intentId) {
      await this.prisma.qrPaymentIntent.update({
        where: { id: input.intentId },
        data: { status: "CONSUMED", consumedByTransactionId: transaction.id },
      });
    }

    if (transaction.status === "COMPLETED") {
      await this.loyalty.earnForTransaction({
        customerId,
        transactionId: transaction.id,
        amountMinor,
      });
    }

    await this.audit.record({
      actorType: "CUSTOMER",
      actorId: customerId,
      action: "PAYMENT_CREATED",
      targetType: "Transaction",
      targetId: transaction.id,
      metadata: { merchantId: input.merchantId, amountMinor, status: transaction.status },
    });

    return { statusCode: 201, body: transaction };
  }

  async refund(transactionId: string, actorId: string, input: RefundPaymentInput, idempotencyKey: string) {
    const { statusCode, body, replayed } = await this.idempotency.withIdempotency(
      idempotencyKey,
      "payments.refund",
      { transactionId, ...input },
      () => this.executeRefund(transactionId, actorId, input),
    );

    return { ...body, replayed, statusCode };
  }

  private async executeRefund(transactionId: string, actorId: string, input: RefundPaymentInput) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    if (transaction.status !== "COMPLETED") {
      throw new BadRequestException("Only completed transactions can be refunded");
    }
    if (!transaction.providerPaymentId) {
      throw new BadRequestException("Transaction has no provider payment to refund");
    }

    const amountMinor = input.amountMinor ?? transaction.amountMinor;
    if (amountMinor > transaction.amountMinor) {
      throw new BadRequestException("Refund amount cannot exceed the original transaction amount");
    }

    const providerResult = await this.orchestrator.refund({
      providerPaymentId: transaction.providerPaymentId,
      amountMinor,
      reason: input.reason,
    });

    const refundRequest = await this.prisma.refundRequest.create({
      data: {
        transactionId,
        amountMinor,
        status: providerResult.status === "SUCCEEDED" ? "COMPLETED" : "REJECTED",
        reason: input.reason,
        requestedBy: actorId,
      },
    });

    if (providerResult.status === "SUCCEEDED") {
      const isFullRefund = amountMinor === transaction.amountMinor;
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: isFullRefund ? "REFUNDED" : transaction.status },
      });

      if (isFullRefund) {
        await this.loyalty.reverseForTransaction(
          transactionId,
          transaction.customerId,
          "Transaction refunded",
        );
      }
    }

    await this.audit.record({
      actorType: "ADMIN",
      actorId,
      action: "PAYMENT_REFUNDED",
      targetType: "Transaction",
      targetId: transactionId,
      metadata: { amountMinor, status: refundRequest.status },
    });

    return { statusCode: 201, body: refundRequest };
  }
}
