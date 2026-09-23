export class ServiceRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Service call failed with ${status}: ${body}`);
  }
}

/**
 * Minimal fetch wrapper for trusted service-to-service calls between domain
 * services (identity/merchants/payments/loyalty). Authenticates with the
 * shared INTERNAL_SERVICE_TOKEN header — never used for customer/admin traffic.
 */
export class ServiceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
  ) {}

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": this.internalToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceRequestError(response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
  }
}
