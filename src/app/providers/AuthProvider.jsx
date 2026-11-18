import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subscribe, STORAGE_KEYS } from '../../services/storageService';
import * as auth from '../../services/authService';
import { clearDraft } from '../../services/bookingService';

const AuthContext = createContext(null);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Current user + sign-in / sign-out / first-time admin setup. There is no public sign-up.
 * Signing out in one tab signs out every open tab.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.getCurrentUser());

  useEffect(() => subscribe((key) => {
    if (key === STORAGE_KEYS.session || key === STORAGE_KEYS.users) {
      const next = auth.getCurrentUser();
      setUser((prev) => (same(prev, next) ? prev : next));
    }
  }), []);

  // A session can expire while the tab stays open.
  useEffect(() => {
    const id = setInterval(() => { const next = auth.getCurrentUser(); setUser((prev) => (same(prev, next) ? prev : next)); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const login = useCallback(async (input) => { const u = await auth.login(input); setUser(u); return u; }, []);
  const setup = useCallback(async (input) => { const u = await auth.setupAdmin(input); setUser(u); return u; }, []);
  const logout = useCallback(() => { auth.logout(); clearDraft(); setUser(null); }, []);

  const value = useMemo(() => ({ user, isAdmin: user?.role === auth.ROLES.admin, login, setup, logout }), [user, login, setup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
