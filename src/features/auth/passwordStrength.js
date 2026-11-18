const COMMON = ['password', 'password1', 'passw0rd', '12345678', '123456789', 'qwerty123', 'qwertyuiop', 'iloveyou', 'admin123', 'welcome1', 'letmein123'];

/** Individual requirements shown as a live checklist. */
export const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'letter', label: 'A letter', test: (p) => /[A-Za-z]/.test(p) },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'mix', label: 'Upper & lower case or a symbol', test: (p) => (/[a-z]/.test(p) && /[A-Z]/.test(p)) || /[^A-Za-z0-9]/.test(p) },
];

/** score: 0 (empty) … 4 (strong). The first three rules are mandatory; the fourth and length >= 12 raise the score. */
export function passwordStrength(password = '') {
  const checks = RULES.map((r) => ({ ...r, ok: r.test(password) }));
  if (!password) return { score: 0, label: '', checks };
  const common = COMMON.includes(password.toLowerCase());
  let score = checks.filter((c) => c.ok).length; // 0-4
  if (password.length >= 12 && score >= 3) score = Math.min(4, score + 1);
  if (common || /^(.)\1+$/.test(password)) score = Math.min(score, 1);
  score = Math.max(1, Math.min(4, score));
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score], checks, common };
}
