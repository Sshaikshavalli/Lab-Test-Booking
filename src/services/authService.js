import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from './storageService';
import { normaliseMobile } from '../utils/validation';

/**
 * Browser-local accounts. Only laboratory administrators have accounts — patients never sign in.
 * There is NO public sign-up:
 *  - the very first administrator is created once on the /setup screen (only while no admin exists);
 *  - after that, only an administrator can create, reset or remove administrator accounts and book slots.
 * Accounts live in this browser only (there is no server), passwords are never stored in plain text
 * (salted PBKDF2-SHA-256 where Web Crypto is available), and sessions sync across tabs.
 */
export const ROLES = { admin: 'admin' };
export const MAX_ATTEMPTS = 5;
export const LOCK_SECONDS = 60;
const REMEMBER_MS = 30 * 24 * 3600e3;
const SESSION_MS = 12 * 3600e3;
const ITERATIONS = 100_000;

export class AuthError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/* ───────────── password hashing ───────────── */
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const randomSalt = () => {
  const a = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(a);
  else for (let i = 0; i < a.length; i += 1) a[i] = Math.floor(Math.random() * 256);
  return toHex(a);
};

export async function hashPassword(password, salt) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new AuthError('INSECURE_CONTEXT', 'Secure sign-in needs https (or localhost). Open the app over https.');
  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `p1:${toHex(bits)}`;
}

/** Compare without bailing out at the first differing character. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ───────────── storage helpers ───────────── */
const normaliseEmail = (e) => String(e ?? '').trim().toLowerCase();
/** Only administrator records are ever returned (older builds could store patient accounts; those are ignored). */
const loadUsers = () => { const u = readJSON(STORAGE_KEYS.users, []); return Array.isArray(u) ? u.filter((x) => x?.role === ROLES.admin) : []; };
const publicUser = ({ passwordHash, salt, ...rest }) => rest; // never hand the hash to the UI

export function getCurrentUser(now = Date.now()) {
  const session = readJSON(STORAGE_KEYS.session, null);
  if (!session?.userId || !(session.expiresAt > now)) return null;
  const user = loadUsers().find((u) => u.id === session.userId);
  return user ? publicUser(user) : null;
}

function startSession(userId, remember, now = Date.now()) {
  writeJSON(STORAGE_KEYS.session, { userId, expiresAt: now + (remember ? REMEMBER_MS : SESSION_MS) });
}

/* ───────────── failed-login throttle ───────────── */
function checkLock(email, now) {
  const rec = readJSON(STORAGE_KEYS.authAttempts, {})[email];
  if (rec?.until > now) {
    const secs = Math.ceil((rec.until - now) / 1000);
    throw new AuthError('LOCKED', `Too many failed attempts. Try again in ${secs} second${secs === 1 ? '' : 's'}.`);
  }
}
function recordFailure(email, now) {
  const all = readJSON(STORAGE_KEYS.authAttempts, {});
  const prev = all[email];
  const count = (prev?.until && prev.until <= now ? 0 : prev?.count ?? 0) + 1;
  all[email] = count >= MAX_ATTEMPTS ? { count: 0, until: now + LOCK_SECONDS * 1000 } : { count, until: 0 };
  writeJSON(STORAGE_KEYS.authAttempts, all);
}
function clearFailures(email) {
  const all = readJSON(STORAGE_KEYS.authAttempts, {});
  if (all[email]) { delete all[email]; writeJSON(STORAGE_KEYS.authAttempts, all); }
}

/* ───────────── public API ───────────── */
const saveUsers = (list) => writeJSON(STORAGE_KEYS.users, list);

/** True once an administrator exists (the /setup screen is only available before that). */
export const hasAdmin = () => loadUsers().some((u) => u.role === ROLES.admin);

function requireAdmin() {
  const me = getCurrentUser();
  if (me?.role !== ROLES.admin) throw new AuthError('FORBIDDEN', 'Only an administrator can do this.');
  return me;
}

async function buildUser({ name, email, mobile, password }) {
  const salt = randomSalt();
  return {
    id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name).trim().replace(/\s+/g, ' '),
    email: normaliseEmail(email),
    mobile: normaliseMobile(mobile),
    role: ROLES.admin,
    createdAt: new Date().toISOString(),
    mustChangePassword: false,
    salt,
    passwordHash: await hashPassword(password, salt),
  };
}

const emailTaken = () => new AuthError('EMAIL_TAKEN', 'An account with this email already exists.');

/** One-time bootstrap: creates the first administrator and signs them in. */
export async function setupAdmin({ name, email, mobile, password }) {
  if (hasAdmin()) throw new AuthError('SETUP_DONE', 'An administrator already exists. Please sign in.');
  const user = await buildUser({ name, email, mobile, password });
  if (hasAdmin()) throw new AuthError('SETUP_DONE', 'An administrator already exists. Please sign in.'); // another tab won the race
  saveUsers([...loadUsers(), user]);
  startSession(user.id, true);
  return publicUser(user);
}

/** Admin only. Creates another laboratory administrator, who must choose their own password at first sign-in. */
export async function createAccount({ name, email, mobile, password }) {
  requireAdmin();
  if (loadUsers().some((u) => u.email === normaliseEmail(email))) throw emailTaken();
  const user = { ...(await buildUser({ name, email, mobile, password })), mustChangePassword: true };
  const fresh = loadUsers(); // re-read after the slow hash
  if (fresh.some((u) => u.email === user.email)) throw emailTaken();
  saveUsers([...fresh, user]);
  return publicUser(user);
}

/** Admin only. */
export function listAccounts() {
  requireAdmin();
  return loadUsers().map(publicUser).sort((a, b) => a.name.localeCompare(b.name));
}

/** Admin only. Removes an account (never yourself, and never the last administrator). */
export function removeAccount(id) {
  const me = requireAdmin();
  const users = loadUsers();
  const target = users.find((u) => u.id === id);
  if (!target) throw new AuthError('NOT_FOUND', 'Account not found.');
  if (target.id === me.id) throw new AuthError('SELF', 'You can’t remove your own account.');
  if (users.length <= 1) throw new AuthError('LAST_ADMIN', 'At least one administrator must remain.');
  saveUsers(users.filter((u) => u.id !== id));
}

/** Admin only. Sets a temporary password; the user must replace it at next sign-in. */
export async function resetPassword(id, password) {
  requireAdmin();
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) throw new AuthError('NOT_FOUND', 'Account not found.');
  const salt = randomSalt();
  const next = [...users];
  next[idx] = { ...users[idx], salt, passwordHash: await hashPassword(password, salt), mustChangePassword: true };
  saveUsers(next);
}

/** Any signed-in user, for their own account. */
export async function changePassword({ current, next }) {
  const me = getCurrentUser();
  if (!me) throw new AuthError('FORBIDDEN', 'Please sign in again.');
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === me.id);
  const attempt = await hashPassword(current, users[idx].salt);
  if (!safeEqual(attempt, users[idx].passwordHash)) throw new AuthError('BAD_CREDENTIALS', 'Your current password is incorrect.');
  const salt = randomSalt();
  const copy = [...users];
  copy[idx] = { ...users[idx], salt, passwordHash: await hashPassword(next, salt), mustChangePassword: false };
  saveUsers(copy);
  return publicUser(copy[idx]);
}

/** A random password that satisfies the strength rules (letters, digits, a symbol), without look-alike characters. */
export function generatePassword(length = 12) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '@#$%&*?'];
  const pick = (chars) => {
    const buf = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(buf); else buf[0] = Math.floor(Math.random() * 2 ** 32);
    return chars[buf[0] % chars.length];
  };
  const all = sets.join('');
  const out = [...sets.map(pick), ...Array.from({ length: length - sets.length }, () => pick(all))];
  for (let i = out.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.join('');
}

export async function login({ email, password, remember = false }) {
  const mail = normaliseEmail(email);
  const now = Date.now();
  checkLock(mail, now);
  const user = loadUsers().find((u) => u.email === mail);
  // Hash even when the account does not exist, so response time does not reveal which emails are registered.
  const attempt = await hashPassword(password, user?.salt ?? 'unknown-account-salt');
  if (!user || !safeEqual(attempt, user.passwordHash)) {
    recordFailure(mail, now);
    throw new AuthError('BAD_CREDENTIALS', 'That email and password don’t match. Please check them and try again.');
  }
  clearFailures(mail);
  startSession(user.id, remember);
  return publicUser(user);
}

export function logout() { removeKey(STORAGE_KEYS.session); }
