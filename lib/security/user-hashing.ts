import { createHash } from "crypto";
import { parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js";

export interface HashedUserData {
  hashedPhone?: string;
  hashedEmail?: string;
  rawE164Phone?: string;
}

/**
 * Normaliza un número telefónico de Colombia al estándar E.164 (+573XXXXXXXXX)
 * y genera el hash SHA-256 (Hexadecimal) para Google Enhanced Conversions.
 */
export function normalizeAndHashPhone(rawPhone?: string, countryCode = "CO"): HashedUserData {
  if (!rawPhone || !rawPhone.trim()) return {};

  try {
    const cleaned = rawPhone.trim();
    // Parsear número con libphonenumber-js
    const phoneNumber = parsePhoneNumberWithError(cleaned, countryCode as CountryCode);

    if (!phoneNumber.isValid()) {
      return {};
    }

    const e164Phone = phoneNumber.format("E.164"); // Ejemplo: "+573001234567"

    // Hashear en SHA-256 (Hexadecimal)
    const hashedPhone = createHash("sha256")
      .update(e164Phone)
      .digest("hex");

    return {
      hashedPhone,
      rawE164Phone: e164Phone,
    };
  } catch {
    // Fallback: Limpieza por RegEx si libphonenumber no puede parsearlo
    const digitsOnly = rawPhone.replace(/\D/g, "");
    if (digitsOnly.length === 10) {
      const e164Phone = `+57${digitsOnly}`;
      const hashedPhone = createHash("sha256")
        .update(e164Phone)
        .digest("hex");
      return { hashedPhone, rawE164Phone: e164Phone };
    }
    return {};
  }
}

/**
 * Normaliza y hashea una dirección de correo electrónico en SHA-256.
 */
export function normalizeAndHashEmail(rawEmail?: string): string | undefined {
  if (!rawEmail || !rawEmail.trim()) return undefined;

  const cleaned = rawEmail.trim().toLowerCase();
  return createHash("sha256")
    .update(cleaned)
    .digest("hex");
}
