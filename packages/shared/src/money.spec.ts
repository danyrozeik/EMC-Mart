import { describe, expect, it } from "vitest";
import { addMoney, egpToMinor, formatEGP, minorToEgp, money, subtractMoney } from "./money";

describe("money", () => {
  it("converts EGP to minor units (piastres)", () => {
    expect(egpToMinor(1250)).toBe(125000);
    expect(egpToMinor(1250.5)).toBe(125050);
  });

  it("converts minor units back to EGP", () => {
    expect(minorToEgp(125000)).toBe(1250);
    expect(minorToEgp(125050)).toBe(1250.5);
  });

  it("rejects negative or non-integer minor amounts", () => {
    expect(() => money(-1)).toThrow();
    expect(() => money(1.5)).toThrow();
  });

  it("adds money of the same currency", () => {
    expect(addMoney(money(100), money(50))).toEqual({ currency: "EGP", minor: 150 });
  });

  it("rejects subtraction that would go negative", () => {
    expect(() => subtractMoney(money(50), money(100))).toThrow();
  });

  it("formats EGP for display", () => {
    expect(formatEGP(money(1245000))).toBe("EGP 12,450");
    expect(formatEGP(money(1245050))).toBe("EGP 12,450.50");
  });
});
