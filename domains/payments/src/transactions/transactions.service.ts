import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async forCustomer(customerId: string, take = 50, skip = 0) {
    return this.prisma.transaction.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  }

  async getById(id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    return transaction;
  }
}
