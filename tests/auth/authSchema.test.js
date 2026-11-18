import { describe, expect, it } from 'vitest';
import { changePasswordSchema, createAccountSchema, loginSchema, setupSchema } from '../../src/features/auth/authSchema';
import { passwordStrength } from '../../src/features/auth/passwordStrength';

const errs = (schema, v) => { const r = schema.safeParse(v); return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])); };
const person = { fullName: 'Asha Rao', mobile: '98450 12345', email: 'asha@mail.com', password: 'Secret123x' };

describe('login schema', () => {
  it('requires a valid email and a password', () => {
    expect(errs(loginSchema, { email: '', password: '' })).toMatchObject({ email: expect.any(String), password: expect.any(String) });
    expect(errs(loginSchema, { email: 'nope', password: 'x' }).email).toBeTruthy();
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});

describe('administrator setup schema', () => {
  it('accepts valid details and flags mismatched confirmation', () => {
    expect(setupSchema.safeParse({ ...person, confirm: 'Secret123x' }).success).toBe(true);
    expect(errs(setupSchema, { ...person, confirm: 'Different123' }).confirm).toMatch(/match/i);
  });
  it('requires letters and numbers, at least 8 characters', () => {
    for (const bad of ['short1', 'onlyletters', '123456789']) expect(errs(setupSchema, { ...person, password: bad, confirm: bad }).password).toBeTruthy();
  });
});

describe('create-account schema (administrator form)', () => {
  it('describes a lab admin account (no role field)', () => {
    expect(createAccountSchema.safeParse({ ...person }).success).toBe(true);
  });
  it('validates mobile numbers', () => {
    expect(errs(createAccountSchema, { ...person, mobile: '12345' }).mobile).toBeTruthy();
  });
});

describe('change-password schema', () => {
  it('requires a different, matching, valid new password', () => {
    expect(changePasswordSchema.safeParse({ current: 'Old12345', next: 'New12345x', confirm: 'New12345x' }).success).toBe(true);
    expect(errs(changePasswordSchema, { current: 'Old12345', next: 'New12345x', confirm: 'other' }).confirm).toMatch(/match/i);
    expect(errs(changePasswordSchema, { current: 'Same1234', next: 'Same1234', confirm: 'Same1234' }).next).toMatch(/different/i);
  });
});

describe('password strength', () => {
  it('scores from weak to strong and flags common passwords', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('abc').score).toBe(1);
    expect(passwordStrength('password').score).toBe(1);
    expect(passwordStrength('Abcdefg1').score).toBeGreaterThanOrEqual(3);
    expect(passwordStrength('Abcdefg1!xyz').score).toBe(4);
  });
});
