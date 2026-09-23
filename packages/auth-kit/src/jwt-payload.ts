import type { AdminRole } from "@rti/shared";

export interface JwtPayload {
  sub: string;
  actorType: "CUSTOMER" | "ADMIN";
  role?: AdminRole;
}
