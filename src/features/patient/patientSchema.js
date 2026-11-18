import { z } from 'zod';
import { EMAIL_RE, MOBILE_RE, NAME_RE, normaliseMobile } from '../../utils/validation';
import { ageFromDob, fromISODate } from '../../utils/dateUtils';
import { isValid } from 'date-fns';

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const patientSchema = z.object({
  fullName: z.string().trim()
    .min(2, 'Enter the patient’s full name')
    .regex(NAME_RE, 'Use letters, spaces, dots, apostrophes or hyphens only'),
  dob: z.string().min(1, 'Enter the date of birth')
    .refine((v) => isValid(fromISODate(v)), 'Enter a valid date')
    .refine((v) => !isValid(fromISODate(v)) || fromISODate(v) <= new Date(), 'Date of birth cannot be in the future')
    .refine((v) => !isValid(fromISODate(v)) || (ageFromDob(v) ?? 0) <= 120, 'Enter a realistic date of birth'),
  gender: z.string().optional().default(''),
  mobile: z.string().min(1, 'Enter a mobile number')
    .refine((v) => MOBILE_RE.test(normaliseMobile(v)), 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().optional().default('')
    .refine((v) => v === '' || EMAIL_RE.test(v), 'Enter a valid email address'),
});

/** Normalised patient record stored with the booking. */
export const cleanPatient = (values) => ({
  fullName: values.fullName.trim().replace(/\s+/g, ' '),
  dob: values.dob,
  gender: values.gender || '',
  mobile: normaliseMobile(values.mobile),
  email: (values.email ?? '').trim(),
});
