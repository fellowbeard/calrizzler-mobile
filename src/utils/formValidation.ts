import { parse } from "tldts";

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidEmail(value: string) {
  const email = value.trim();

  // Basic email structure first
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return false;
  }

  const domain = email.split("@")[1];
  const parsedDomain = parse(domain);

  return Boolean(
    parsedDomain.domain && parsedDomain.publicSuffix && parsedDomain.isIcann
  );
}
