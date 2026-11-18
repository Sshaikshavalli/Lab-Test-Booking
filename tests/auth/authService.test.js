import { beforeEach, describe, expect, it } from 'vitest';
import {
  AuthError, MAX_ATTEMPTS, changePassword, createAccount, generatePassword, getCurrentUser, hasAdmin, listAccounts,
  login, logout, removeAccount, resetPassword, setupAdmin,
} from '../../src/services/authService';

const admin = { name: 'Lab  Admin', email: ' Admin@Lab.in ', mobile: '+91 98450 12345', password: 'Admin@12345' };
const second = { name: 'Ravi Kumar', email: 'ravi@mail.com', mobile: '9845012346', password: 'Temp#Pass123' };

beforeEach(() => {
  const store = new Map();
  globalThis.window = {
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
    addEventListener() {},
  };
  globalThis.__store = store;
});

describe('first-run administrator setup', () => {
  it('creates the first administrator once, normalises the profile and signs them in', async () => {
    expect(hasAdmin()).toBe(false);
    const u = await setupAdmin(admin);
    expect(u).toMatchObject({ name: 'Lab Admin', email: 'admin@lab.in', mobile: '9845012345', role: 'admin' });
    expect(u.passwordHash).toBeUndefined();
    expect(getCurrentUser()?.id).toBe(u.id);
    expect(hasAdmin()).toBe(true);
  });
  it('is unavailable once an administrator exists', async () => {
    await setupAdmin(admin);
    await expect(setupAdmin({ ...admin, email: 'other@lab.in' })).rejects.toMatchObject({ code: 'SETUP_DONE' });
  });
});

describe('accounts are created by administrators only', () => {
  it('rejects account creation when nobody is signed in', async () => {
    await expect(createAccount({ ...second })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await setupAdmin(admin);
    logout();
    await expect(createAccount({ ...second })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(() => listAccounts()).toThrow(AuthError);
  });
  it('lets an administrator create other administrators (with a temporary password) — and nothing else', async () => {
    await setupAdmin(admin);
    const p = await createAccount(second);
    expect(p).toMatchObject({ role: 'admin', mustChangePassword: true });
    // a role in the input is ignored: every account is an administrator
    expect((await createAccount({ ...second, email: 'two@lab.in', role: 'patient' })).role).toBe('admin');
    expect(listAccounts().every((u) => u.role === 'admin')).toBe(true);
    expect(listAccounts()).toHaveLength(3);
  });
  it('ignores legacy patient accounts: they cannot sign in and are never listed', async () => {
    await setupAdmin(admin);
    const users = JSON.parse(globalThis.__store.get('ltbs:users'));
    const legacy = { ...users[0], id: 'u-legacy', email: 'old@patient.in', role: 'patient' };
    globalThis.__store.set('ltbs:users', JSON.stringify([...users, legacy]));
    expect(listAccounts().some((u) => u.email === 'old@patient.in')).toBe(false);
    logout();
    await expect(login({ email: 'old@patient.in', password: admin.password })).rejects.toMatchObject({ code: 'BAD_CREDENTIALS' });
  });
  it('stores only a salted hash and rejects duplicate emails regardless of case', async () => {
    await setupAdmin(admin);
    await createAccount(second);
    expect(globalThis.__store.get('ltbs:users')).not.toContain(second.password);
    await expect(createAccount({ ...second, email: 'RAVI@mail.com' })).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });
  it('never removes yourself or the last administrator', async () => {
    const a = await setupAdmin(admin);
    expect(() => removeAccount(a.id)).toThrow(/own account/i);
    const p = await createAccount(second);
    removeAccount(p.id);
    expect(listAccounts()).toHaveLength(1);
  });
});

describe('sign in and passwords', () => {
  it('forces a new password after an administrator-issued one', async () => {
    await setupAdmin(admin);
    await createAccount(second);
    logout();
    expect((await login({ email: second.email, password: second.password })).mustChangePassword).toBe(true);
    await expect(changePassword({ current: 'wrong', next: 'Brand9New1' })).rejects.toMatchObject({ code: 'BAD_CREDENTIALS' });
    expect((await changePassword({ current: second.password, next: 'Brand9New1' })).mustChangePassword).toBe(false);
    logout();
    expect((await login({ email: second.email, password: 'Brand9New1' })).email).toBe(second.email);
  });
  it('lets an administrator reset a password, which is temporary again', async () => {
    await setupAdmin(admin);
    const p = await createAccount(second);
    await resetPassword(p.id, 'Reset#Pass456');
    logout();
    expect((await login({ email: second.email, password: 'Reset#Pass456' })).mustChangePassword).toBe(true);
  });
  it('gives the same error for a wrong password and an unknown email, and locks after repeated failures', async () => {
    await setupAdmin(admin);
    logout();
    const a = await login({ email: 'admin@lab.in', password: 'nope' }).catch((e) => e);
    const b = await login({ email: 'ghost@lab.in', password: 'nope' }).catch((e) => e);
    expect(a.code).toBe('BAD_CREDENTIALS'); expect(b.message).toBe(a.message);
    for (let i = 1; i < MAX_ATTEMPTS; i += 1) await login({ email: 'admin@lab.in', password: 'bad' }).catch(() => {});
    await expect(login({ email: 'admin@lab.in', password: admin.password })).rejects.toMatchObject({ code: 'LOCKED' });
  });
  it('expires sessions', async () => {
    await setupAdmin(admin);
    const s = JSON.parse(globalThis.__store.get('ltbs:session'));
    globalThis.__store.set('ltbs:session', JSON.stringify({ ...s, expiresAt: Date.now() - 1 }));
    expect(getCurrentUser()).toBeNull();
  });
  it('generates passwords that satisfy the strength rules', () => {
    for (let i = 0; i < 20; i += 1) {
      const p = generatePassword();
      expect(p).toHaveLength(12);
      expect(/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[@#$%&*?]/.test(p)).toBe(true);
    }
  });
});
