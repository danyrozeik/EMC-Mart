import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { LoginInput, RegisterCustomerInput } from "@rti/shared";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async registerCustomer(input: RegisterCustomerInput) {
    const existing = await this.prisma.customer.findUnique({ where: { phone: input.phone } });
    if (existing) {
      throw new ConflictException("A customer with this phone number already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const customer = await this.prisma.customer.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        passwordHash,
        preferredLanguage: input.preferredLanguage,
        kycStatus: "NOT_STARTED",
      },
    });

    await this.audit.record({
      actorType: "CUSTOMER",
      actorId: customer.id,
      action: "CUSTOMER_REGISTERED",
      targetType: "Customer",
      targetId: customer.id,
    });

    return this.issueTokenFor(customer.id, "CUSTOMER");
  }

  async loginCustomer(input: LoginInput) {
    const customer = await this.prisma.customer.findUnique({ where: { phone: input.phone } });
    if (!customer || !(await bcrypt.compare(input.password, customer.passwordHash))) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    return this.issueTokenFor(customer.id, "CUSTOMER");
  }

  private issueTokenFor(sub: string, actorType: "CUSTOMER" | "ADMIN", role?: string) {
    const accessToken = this.jwt.sign({ sub, actorType, role });
    return { accessToken, actorType, sub };
  }
}
