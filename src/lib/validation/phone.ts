import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import type { PhoneAnswer } from "@/forms/answers";

export function normalizePhone(rawInput: string, country: string): PhoneAnswer | null {
  const phoneNumber = parsePhoneNumberFromString(rawInput, country as CountryCode);

  if (!phoneNumber || !phoneNumber.isValid()) {
    return null;
  }

  return {
    country: phoneNumber.country ?? country,
    countryCode: phoneNumber.countryCallingCode,
    nationalNumber: phoneNumber.nationalNumber,
    e164: phoneNumber.number,
    display: phoneNumber.formatNational(),
  };
}
