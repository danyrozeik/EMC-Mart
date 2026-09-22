import { z } from "zod";

export const MoneyMinorSchema = z
  .number()
  .int()
  .positive("Amount must be a positive integer in minor EGP units (piastres)");

export const CreateQrPaymentIntentSchema = z.object({
  merchantId: z.string().min(1),
  amountMinor: MoneyMinorSchema,
  reference: z.string().min(1).max(140),
});
export type CreateQrPaymentIntentInput = z.infer<typeof CreateQrPaymentIntentSchema>;

export const CreatePaymentSchema = z.object({
  customerId: z.string().min(1),
  merchantId: z.string().min(1),
  amountMinor: MoneyMinorSchema,
  reference: z.string().min(1).max(140),
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

/** Body for POST /v1/payments — customerId is taken from the authenticated JWT, never the client. */
export const PayMerchantSchema = z.object({
  intentId: z.string().min(1).optional(),
  merchantId: z.string().min(1),
  amountMinor: MoneyMinorSchema,
  reference: z.string().min(1).max(140),
});
export type PayMerchantInput = z.infer<typeof PayMerchantSchema>;

export const RefundPaymentSchema = z.object({
  amountMinor: MoneyMinorSchema.optional(),
  reason: z.string().max(280).optional(),
});
export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;

export const SendMoneySchema = z.object({
  fromCustomerId: z.string().min(1),
  toCustomerId: z.string().min(1),
  amountMinor: MoneyMinorSchema,
  note: z.string().max(140).optional(),
});
export type SendMoneyInput = z.infer<typeof SendMoneySchema>;

export const IdempotencyKeyHeaderSchema = z.string().min(8).max(128);

export const RegisterCustomerSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().regex(/^\+20\d{9,10}$/, "Phone must be a valid Egyptian E.164 number, e.g. +201234567890"),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72),
  preferredLanguage: z.enum(["ar", "en"]).default("en"),
});
export type RegisterCustomerInput = z.infer<typeof RegisterCustomerSchema>;

export const LoginSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterMerchantSchema = z.object({
  businessName: z.string().min(2).max(160),
  category: z.string().min(2).max(80),
});
export type RegisterMerchantInput = z.infer<typeof RegisterMerchantSchema>;
