import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

/**
 * Marks an endpoint as service-to-service only (never called by a customer/admin
 * JWT) and exempts it from JwtAuthGuard. InternalServiceGuard then enforces the
 * shared INTERNAL_SERVICE_TOKEN header instead.
 */
export const IS_INTERNAL_KEY = "isInternal";
export const Internal = () => SetMetadata(IS_INTERNAL_KEY, true);

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers["x-internal-token"];
    const expected = this.config.getOrThrow<string>("INTERNAL_SERVICE_TOKEN");

    if (token !== expected) {
      throw new UnauthorizedException("Invalid or missing internal service token");
    }
    return true;
  }
}
