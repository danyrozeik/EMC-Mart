import { Body, Controller, HttpCode, Post, UsePipes } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LoginSchema, RegisterCustomerSchema, type LoginInput, type RegisterCustomerInput } from "@rti/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { Public } from "./public.decorator";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @UsePipes(new ZodValidationPipe(RegisterCustomerSchema))
  register(@Body() body: RegisterCustomerInput) {
    return this.authService.registerCustomer(body);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: LoginInput) {
    return this.authService.loginCustomer(body);
  }
}
