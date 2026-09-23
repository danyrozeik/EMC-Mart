import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtPayload } from "@rti/auth-kit";
import { TransactionsService } from "./transactions.service";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("v1/transactions")
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("take") take?: string, @Query("skip") skip?: string) {
    return this.transactions.forCustomer(
      user.sub,
      take ? Number(take) : undefined,
      skip ? Number(skip) : undefined,
    );
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.transactions.getById(id);
  }
}
