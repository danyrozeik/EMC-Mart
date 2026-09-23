import { ServiceClient } from "./service-client";

export interface RecordAuditInput {
  actorType: "CUSTOMER" | "MERCHANT" | "ADMIN" | "SYSTEM";
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget-tolerant client every domain service uses to record an
 * audit entry in the identity service, which owns the centralized audit log.
 */
export class AuditClient {
  private readonly client: ServiceClient;

  constructor(identityServiceUrl: string, internalToken: string) {
    this.client = new ServiceClient(identityServiceUrl, internalToken);
  }

  async record(input: RecordAuditInput): Promise<void> {
    await this.client.post("/internal/audit-logs", input);
  }
}
