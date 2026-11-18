import { describe, it, expect } from 'vitest';
import { patientSchema, cleanPatient } from '../../src/features/patient/patientSchema';
import { normaliseMobile } from '../../src/utils/validation';

const ok = { fullName: 'Aarav Reddy', dob: '1990-05-14', gender: 'Male', mobile: '98480 12345', email: '' };
const errorsOf = (v) => { const r = patientSchema.safeParse(v); return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])); };

describe('patient schema', () => {
  it('accepts a valid patient and normalises the record', () => {
    expect(patientSchema.safeParse(ok).success).toBe(true);
    expect(cleanPatient(ok).mobile).toBe('9848012345');
  });
  it('requires name, date of birth and mobile', () => {
    const e = errorsOf({ fullName: '', dob: '', mobile: '' });
    expect(e.fullName).toBeTruthy(); expect(e.dob).toBeTruthy(); expect(e.mobile).toBeTruthy();
  });
  it('validates mobile formats, including a +91 prefix', () => {
    expect(errorsOf({ ...ok, mobile: '12345' }).mobile).toBeTruthy();
    expect(errorsOf({ ...ok, mobile: '5876543210' }).mobile).toBeTruthy();
    expect(errorsOf({ ...ok, mobile: '+91 98765-43210' }).mobile).toBeUndefined();
    expect(normaliseMobile('+91 98765-43210')).toBe('9876543210');
  });
  it('treats email as optional but validates it when present', () => {
    expect(errorsOf({ ...ok, email: 'nope' }).email).toBeTruthy();
    expect(errorsOf({ ...ok, email: 'a@b.com' }).email).toBeUndefined();
  });
  it('rejects future and implausible dates of birth', () => {
    expect(errorsOf({ ...ok, dob: '2999-01-01' }).dob).toMatch(/future/i);
    expect(errorsOf({ ...ok, dob: '1850-01-01' }).dob).toBeTruthy();
    expect(errorsOf({ ...ok, dob: '2026-02-31' }).dob).toBeTruthy();
  });
  it('rejects names with digits or symbols', () => {
    expect(errorsOf({ ...ok, fullName: 'R2D2 <script>' }).fullName).toBeTruthy();
  });
});
