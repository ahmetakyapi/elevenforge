/**
 * Runtime validation for server action inputs.
 *
 * TypeScript parameter types on a "use server" function are erased at
 * runtime. The client controls the serialized payload, so a signature like
 * `years: 1 | 2 | 3` guarantees nothing — `-1_000_000` arrives just as
 * happily. Every action that reads a number, an id, or free text from the
 * client validates it here first.
 */
import { z } from "zod";

export const uuidSchema = z.uuid({ message: "Geçersiz kimlik." });

/** A money amount supplied by the client, in euros. */
export const euroAmountSchema = z
  .number()
  .finite("Geçersiz tutar.")
  .nonnegative("Tutar negatif olamaz.")
  .max(100_000_000_000, "Tutar çok büyük.");

/** Tactic dials are 0-4 inclusive. */
export const dialSchema = z.number().int().min(0).max(4);

export const chatBodySchema = z
  .string()
  .trim()
  .min(1, "Mesaj boş olamaz.")
  .max(500, "Mesaj en fazla 500 karakter olabilir.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-posta çok uzun.")
  .pipe(z.email({ message: "Geçerli bir e-posta gir." }));

export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .max(200, "Şifre en fazla 200 karakter olabilir.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "İsim en az 2 karakter olmalı.")
  .max(40, "İsim en fazla 40 karakter olabilir.");

export const leagueNameSchema = z
  .string()
  .trim()
  .min(3, "Lig adı en az 3 karakter olmalı.")
  .max(40, "Lig adı en fazla 40 karakter olabilir.");

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4,12}$/, "Geçersiz davet kodu.");

export type ActionFailure = { ok: false; error: string };

/**
 * Parse `input` or return a ready-to-send action failure. Keeps call sites to
 * a two-line guard instead of a try/catch pyramid:
 *
 *     const parsed = validate(schema, input);
 *     if (!parsed.ok) return parsed;
 */
export function validate<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { ok: true; data: T } | ActionFailure {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  return { ok: false, error: first?.message ?? "Geçersiz veri." };
}
