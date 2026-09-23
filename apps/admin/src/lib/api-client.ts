"use client";

export type ServiceName = "identity" | "merchants" | "payments" | "loyalty";

const SERVICE_BASE_URLS: Record<ServiceName, string> = {
  identity: process.env.NEXT_PUBLIC_IDENTITY_API_URL ?? "http://localhost:3001",
  merchants: process.env.NEXT_PUBLIC_MERCHANTS_API_URL ?? "http://localhost:3002",
  payments: process.env.NEXT_PUBLIC_PAYMENTS_API_URL ?? "http://localhost:3003",
  loyalty: process.env.NEXT_PUBLIC_LOYALTY_API_URL ?? "http://localhost:3004",
};

export function serviceBaseUrl(service: ServiceName): string {
  return SERVICE_BASE_URLS[service];
}

const TOKEN_KEY = "rti_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch<T>(
  service: ServiceName,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${SERVICE_BASE_URLS[service]}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RTI API error ${response.status}: ${body}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
