/** Small shared validators (used by the Zod schema and by tests). */
export const MOBILE_RE = /^[6-9]\d{9}$/;
export const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Strip spaces, dashes and an optional +91 / 0 prefix so "+91 98765-43210" validates. */
export function normaliseMobile(raw) {
  return String(raw ?? '').replace(/[\s-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '');
}
