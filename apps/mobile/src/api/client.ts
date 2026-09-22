import Constants from "expo-constants";
import type { LoginInput, RegisterCustomerInput } from "@rti/shared";

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? "http://localhost:3001";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RTI API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (input: LoginInput) => request<{ accessToken: string }>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  register: (input: RegisterCustomerInput) => request<{ accessToken: string }>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  me: () => request("/v1/customers/me"),
  transactions: () => request("/v1/transactions"),
  loyaltyBalance: () => request<{ points: number; unit: string }>("/v1/loyalty/balance"),
  loyaltyLedger: () => request("/v1/loyalty/ledger"),
  pay: (input: { merchantId: string; amountMinor: number; reference: string; intentId?: string }, idempotencyKey: string) =>
    request("/v1/payments", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    }),
};
