import { z } from 'zod';
import { EMAIL_RE, MOBILE_RE, NAME_RE, normaliseMobile } from '../../utils/validation';

const email = z.string().trim().min(1, 'Enter an email address').refine((v) => EMAIL_RE.test(v), 'Enter a valid email address');
const fullName = z.string().trim().min(2, 'Enter the full name').regex(NAME_RE, 'Use letters, spaces, dots, apostrophes or hyphens only');
const mobile = z.string().min(1, 'Enter a mobile number').refine((v) => MOBILE_RE.test(normaliseMobile(v)), 'Enter a valid 10-digit Indian mobile number');
export const password = z.string().min(8, 'Use at least 8 characters').max(128, 'Use 128 characters or fewer')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Include at least one letter and one number');

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address').refine((v) => EMAIL_RE.test(v), 'Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional().default(false),
});

/** First-run administrator setup. */
export const setupSchema = z.object({ fullName, mobile, email, password, confirm: z.string().min(1, 'Re-enter the password') })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'The passwords don’t match' });

/** An administrator creating an account for another laboratory administrator. */
export const createAccountSchema = z.object({ fullName, mobile, email, password });

/** An administrator changing their own password. */
export const changePasswordSchema = z.object({
  current: z.string().min(1, 'Enter your current password'),
  next: password,
  confirm: z.string().min(1, 'Re-enter the new password'),
}).refine((d) => d.next === d.confirm, { path: ['confirm'], message: 'The passwords don’t match' })
  .refine((d) => d.next !== d.current, { path: ['next'], message: 'Choose a password different from the current one' });
