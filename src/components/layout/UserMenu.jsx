import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ClipboardList, LogOut, UserCog } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../common/Toast';

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

/** Avatar button with a dropdown: profile, bookings and sign out. */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!user) return null;
  const item = 'flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-ink-700 hover:bg-ink-100/70';
  const signOut = () => { setOpen(false); logout(); toast('You’ve been signed out'); navigate('/'); };

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${user.name}`}
        className="flex h-11 items-center gap-2 rounded-xl border border-ink-100 bg-white pl-1.5 pr-2.5 transition hover:border-brand-400">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{initials(user.name)}</span>
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:block">{user.name.split(' ')[0]}</span>
        <ChevronDown className={`h-4 w-4 text-ink-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .15 }}
            className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-ink-100 bg-white p-2 shadow-lift">
            <div className="border-b border-ink-100 px-3 pb-3 pt-2">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
            <div className="py-1.5">
              <Link role="menuitem" to="/account" onClick={() => setOpen(false)} className={item}><UserCog className="h-4 w-4" aria-hidden />Profile</Link>
              <Link role="menuitem" to="/bookings" onClick={() => setOpen(false)} className={item}><ClipboardList className="h-4 w-4" aria-hidden />Bookings</Link>
            </div>
            <button type="button" role="menuitem" onClick={signOut} className={`${item} border-t border-ink-100 text-coral-500`}><LogOut className="h-4 w-4" aria-hidden />Sign out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
