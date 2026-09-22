import type { Money } from "./domain";

const MINOR_PER_EGP = 100;

export function egpToMinor(egp: number): number {
  if (!Number.isFinite(egp)) {
    throw new Error("Amount must be a finite number");
  }
  const minor = Math.round(egp * MINOR_PER_EGP);
  if (!Number.isInteger(minor)) {
    throw new Error("Amount could not be converted to an integer minor unit");
  }
  return minor;
}

export function minorToEgp(minor: number): number {
  assertMinor(minor);
  return minor / MINOR_PER_EGP;
}

export function money(minor: number): Money {
  assertMinor(minor);
  return { currency: "EGP", minor };
}

export function assertMinor(minor: number): void {
  if (!Number.isInteger(minor) || minor < 0) {
    throw new Error("Money.minor must be a non-negative integer");
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { currency: a.currency, minor: a.minor + b.minor };
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const minor = a.minor - b.minor;
  if (minor < 0) {
    throw new Error("Resulting amount cannot be negative");
  }
  return { currency: a.currency, minor };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function formatEGP(amount: Money): string {
  assertMinor(amount.minor);
  const major = amount.minor / MINOR_PER_EGP;
  const formatted = major.toLocaleString("en-US", {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `EGP ${formatted}`;
}
