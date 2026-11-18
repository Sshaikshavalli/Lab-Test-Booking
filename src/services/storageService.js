/**
 * Real-time persistence engine.
 *  - localStorage keeps data across reloads (namespaced with "ltbs:").
 *  - BroadcastChannel + the native `storage` event push every write to the other open tabs,
 *    so a status change on the Bookings page updates Bookings, the dashboard and the
 *    slot picker in other tabs without a reload.
 *  - Always safe against missing, malformed or blocked storage.
 */
const PREFIX = 'ltbs:';
const CHANNEL_NAME = 'ltbs-live-sync';

export const STORAGE_KEYS = {
  cart: 'cart',                   // string[] of selected test ids
  bookings: 'bookings',           // Booking[]
  draft: 'draft',                 // in-progress booking: { patient, labId, date, slotId, collection, address }
  slotOverrides: 'slotOverrides', // { [slotKey]: capacity } set by the lab operator
  users: 'users',                 // registered accounts (password stored only as a salted hash)
  session: 'session',             // { userId, expiresAt }
  authAttempts: 'authAttempts',   // { [email]: { count, until } } failed-login throttle
};

const listeners = new Set();
const emit = (key) => listeners.forEach((fn) => { try { fn(key); } catch { /* a bad listener must not break the others */ } });

let channel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener('message', (e) => emit(e.data?.key));
    channel.unref?.(); // Node (tests): never keep the process alive
  }
} catch {
  channel = null;
}
if (typeof window !== 'undefined') {
  // Fallback for browsers without BroadcastChannel; also fires for writes from other tabs.
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length));
  });
}

/** Subscribe to changes (this tab and other tabs). Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Returns true when the value was stored. Unchanged values are not re-broadcast (prevents tab ping-pong). */
export function writeJSON(key, value) {
  try {
    const next = JSON.stringify(value);
    if (window.localStorage.getItem(PREFIX + key) === next) return true;
    window.localStorage.setItem(PREFIX + key, next);
  } catch {
    return false;
  }
  try { channel?.postMessage({ key }); } catch { /* ignore */ }
  emit(key);
  return true;
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    return;
  }
  try { channel?.postMessage({ key }); } catch { /* ignore */ }
  emit(key);
}
