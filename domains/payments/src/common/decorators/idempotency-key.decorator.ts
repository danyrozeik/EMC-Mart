import { BadRequestException, createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IdempotencyKeyHeaderSchema } from "@rti/shared";
import type { Request } from "express";

export const IdempotencyKey = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const header = request.headers["idempotency-key"];
  const value = Array.isArray(header) ? header[0] : header;

  const parsed = IdempotencyKeyHeaderSchema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException("A valid Idempotency-Key header is required for this request");
  }
  return parsed.data;
});
