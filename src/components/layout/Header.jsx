import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../app/providers/CartProvider';
import { navFor } from './Sidebar';
import UserMenu from './UserMenu';
import { useAuth } from '../../app/providers/AuthProvider';
import { asset } from '../../utils/assetUrl';

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100/70'}`;

/** Live indicator – pulses to show slot availability is streaming in. */
export function LivePill({ className = '' }) {
  return (
    <span className={`chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 ${className}`} role="status">
      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
      Live slots · Bengaluru
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const { count } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const search = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/tests?q=${encodeURIComponent(term)}` : '/tests');
    setQ('');
    setOpen(false);
  };

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Lab Test Booking home">
          <img src={asset('favicon.svg')} alt="" className="h-9 w-9" />
          <span className="font-display text-xl font-semibold text-ink-950">Lab Test <span className="text-brand-500">Booking</span></span>
        </Link>

        <form role="search" onSubmit={search} className="relative ml-auto hidden max-w-md flex-1 md:block">
          <label htmlFor="global-search" className="sr-only">Search tests</label>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input id="global-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tests, codes, biomarkers…" autoComplete="off" className="input !rounded-full !py-2.5 pl-10" />
        </form>

        <LivePill className="ml-auto hidden xl:inline-flex md:ml-0" />

        <div className="flex items-center gap-2">
          {isAdmin && <Link to="/cart" aria-label={`Booking cart, ${count} selected`} className="relative grid h-11 w-11 place-items-center rounded-xl border border-ink-100 bg-white text-ink-900 transition hover:border-brand-400">
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span key={count} initial={{ scale: .4 }} animate={{ scale: [1.4, 1] }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[11px] font-bold text-white">
                  <span className="absolute inset-0 animate-ping rounded-full bg-coral-400 opacity-40 [animation-iteration-count:2]" aria-hidden />
                  <span className="relative">{count}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>}
          {user ? <UserMenu /> : (
            <Link to="/login" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-lift">Lab admin login</Link>
          )}
          <button type="button" className="grid h-11 w-11 place-items-center rounded-xl lg:hidden" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav aria-label="Mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-ink-100 lg:hidden">
            <form role="search" onSubmit={search} className="p-3 md:hidden">
              <label htmlFor="mobile-search" className="sr-only">Search tests</label>
              <input id="mobile-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tests…" className="input" />
            </form>
            <div className="flex flex-col gap-1 p-3 pt-0">
              {navFor(user, isAdmin).map((l) => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={linkCls}>{l.label}</NavLink>)}
              {user ? (
                <button type="button" onClick={() => { setOpen(false); logout(); navigate('/'); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-coral-500 hover:bg-coral-100">Sign out ({user.name.split(' ')[0]})</button>
              ) : (
                <NavLink to="/login" onClick={() => setOpen(false)} className="mt-1 grid min-h-[44px] place-items-center rounded-xl bg-brand-600 text-sm font-semibold text-white">Lab admin login</NavLink>
              )}
              <LivePill className="mt-2 self-start" />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
