import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PayMerchantInput, RefundPaymentInput, LoyaltyOutboxEvent } from "@rti/shared";
import type { AuditClient, ServiceClient } from "@rti/service-client";
import type { Prisma } from "../../generated/prisma-client";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../common/idempotency/idempotency.service";
import { AUDIT_CLIENT, MERCHANTS_CLIENT } from "../common/clients.module";
import { PaymentOrchestrator } from "./payment-orchestrator";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: PaymentOrchestrator,
    private readonly idempotency: IdempotencyService,
    @Inject(MERCHANTS_CLIENT) private readonly merchants: ServiceClient,
    @Inject(AUDIT_CLIENT) private readonly audit: AuditClient,
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
    await this.assertMerchantExists(input.merchantId);

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

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
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
        await tx.qrPaymentIntent.update({
          where: { id: input.intentId },
          data: { status: "CONSUMED", consumedByTransactionId: created.id },
        });
      }

      if (created.status === "COMPLETED") {
        await this.writeOutboxEvent(tx, {
          type: "PAYMENT_COMPLETED",
          customerId,
          transactionId: created.id,
          amountMinor,
        });
      }

      return created;
    });

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

    const refundRequest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.refundRequest.create({
        data: {
          transactionId,
          merchantId: transaction.merchantId ?? "",
          amountMinor,
          status: providerResult.status === "SUCCEEDED" ? "COMPLETED" : "REJECTED",
          reason: input.reason,
          requestedBy: actorId,
        },
      });

      if (providerResult.status === "SUCCEEDED") {
        const isFullRefund = amountMinor === transaction.amountMinor;
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: isFullRefund ? "REFUNDED" : transaction.status },
        });

        if (isFullRefund) {
          await this.writeOutboxEvent(tx, {
            type: "PAYMENT_REFUNDED",
            customerId: transaction.customerId,
            transactionId,
            reason: "Transaction refunded",
          });
        }
      }

      return created;
    });

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

  private async assertMerchantExists(merchantId: string) {
    try {
      await this.merchants.get(`/v1/merchants/${merchantId}`);
    } catch {
      throw new NotFoundException("Merchant not found");
    }
  }

  /**
   * Writes an outbox row in the same DB transaction as the state change it
   * describes, so the event can never be lost or emitted without the write
   * it corresponds to actually having committed. OutboxDispatcherService
   * publishes PENDING rows to Redis independently of this request.
   */
  private writeOutboxEvent(tx: Prisma.TransactionClient, event: LoyaltyOutboxEvent) {
    return tx.outboxEvent.create({
      data: { eventType: event.type, payload: event as unknown as Prisma.InputJsonValue },
    });
  }
}
