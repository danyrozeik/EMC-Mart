import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/public.decorator";
import { AdminAuthService } from "./admin-auth.service";

@ApiTags("admin-auth")
@Controller("v1/admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  login(@Body() body: { email: string; password: string }) {
    return this.adminAuth.login(body.email, body.password);
  }
}
