import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, FlaskConical, LayoutDashboard, PanelLeftClose, PanelLeftOpen, ShoppingBag, UserCog } from 'lucide-react';
import { readJSON, writeJSON } from '../../services/storageService';
import { useCart } from '../../app/providers/CartProvider';
import { useAuth } from '../../app/providers/AuthProvider';

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tests', label: 'Test Catalogue', icon: FlaskConical },
  { to: '/cart', label: 'New Booking', icon: ShoppingBag, badge: true, access: 'admin' },
  { to: '/bookings', label: 'Bookings', icon: ClipboardList, access: 'admin' },
  { to: '/account', label: 'Profile', icon: UserCog, access: 'admin' },
];

/** Menu entries the current visitor may see. */
export function navFor(user, isAdmin) {
  return NAV.filter((n) => !n.access || (n.access === 'admin' && isAdmin));
}

/** Collapsible glass sidebar (desktop). Mobile uses the header menu. */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => readJSON('sidebar', false) === true);
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const toggle = () => setCollapsed((c) => { writeJSON('sidebar', !c); return !c; });

  return (
    <motion.aside initial={false} animate={{ width: collapsed ? 76 : 232 }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      className="glass sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-y-0 border-l-0 p-3 lg:flex" aria-label="Sidebar">
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {navFor(user, isAdmin).map(({ to, label, icon: I, end, badge }) => (
          <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined}
            className={({ isActive }) => `relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100/70'}`}>
            <I className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
            {collapsed && <span className="sr-only">{label}</span>}
            {badge && count > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[11px] font-bold text-white ${collapsed ? 'absolute right-1 top-1' : 'ml-auto'}`}>{count}</span>}
          </NavLink>
        ))}
      </nav>
      <button type="button" onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}
        className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-500 hover:bg-ink-100/70">
        {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden /> : <><PanelLeftClose className="h-5 w-5" aria-hidden />Collapse</>}
      </button>
    </motion.aside>
  );
}
