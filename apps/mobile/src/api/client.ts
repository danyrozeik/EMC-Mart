import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { LoginInput, RegisterCustomerInput } from "@rti/shared";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const IDENTITY_BASE_URL = extra.identityApiUrl ?? "http://localhost:3001";
const PAYMENTS_BASE_URL = extra.paymentsApiUrl ?? "http://localhost:3003";
const LOYALTY_BASE_URL = extra.loyaltyApiUrl ?? "http://localhost:3004";

const TOKEN_STORE_KEY = "rti_access_token";

let accessToken: string | null = null;

/** In-memory only — does not touch SecureStore. Used to hydrate state after a persisted load. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Persists the token to the device's secure keychain/keystore and updates in-memory state. */
export async function persistAccessToken(token: string): Promise<void> {
  accessToken = token;
  await SecureStore.setItemAsync(TOKEN_STORE_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(TOKEN_STORE_KEY);
}

/** Reads a previously persisted token (if any) and hydrates in-memory state from it. */
export async function loadPersistedAccessToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_STORE_KEY);
  accessToken = token;
  return token;
}

async function request<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
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

export interface QrPaymentIntent {
  id: string;
  merchantId: string;
  amountMinor: number;
  reference: string;
  status: "OPEN" | "CONSUMED" | "EXPIRED";
  expiresAt: string;
}

export const api = {
  login: (input: LoginInput) =>
    request<{ accessToken: string }>(IDENTITY_BASE_URL, "/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  register: (input: RegisterCustomerInput) =>
    request<{ accessToken: string }>(IDENTITY_BASE_URL, "/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: () => request(IDENTITY_BASE_URL, "/v1/customers/me"),
  transactions: () => request(PAYMENTS_BASE_URL, "/v1/transactions"),
  loyaltyBalance: () => request<{ points: number; unit: string }>(LOYALTY_BASE_URL, "/v1/loyalty/balance"),
  loyaltyLedger: () => request(LOYALTY_BASE_URL, "/v1/loyalty/ledger"),
  qrIntent: (id: string) => request<QrPaymentIntent>(PAYMENTS_BASE_URL, `/v1/qr/payment-intents/${id}`),
  pay: (input: { merchantId: string; amountMinor: number; reference: string; intentId?: string }, idempotencyKey: string) =>
    request(PAYMENTS_BASE_URL, "/v1/payments", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    }),
};
