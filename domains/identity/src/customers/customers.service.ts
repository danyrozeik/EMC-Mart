import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    const { passwordHash: _passwordHash, ...safe } = customer;
    return safe;
  }

  async submitKyc(customerId: string) {
    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: { kycStatus: "PENDING_REVIEW" },
    });

    await this.prisma.kycCase.create({
      data: { customerId, status: "PENDING_REVIEW" },
    });

    await this.audit.record({
      actorType: "CUSTOMER",
      actorId: customerId,
      action: "KYC_SUBMITTED",
      targetType: "Customer",
      targetId: customerId,
    });

    const { passwordHash: _passwordHash, ...safe } = customer;
    return safe;
  }
}
