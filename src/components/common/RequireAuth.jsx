import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import Button from './Button';

/**
 * Route guard.
 *  - signed-out visitors go to /login and return afterwards;
 *  - accounts with a temporary password must choose their own first (/account);
 *  - only laboratory administrators have accounts, so every guarded route is admin-only.
 */
export default function RequireAuth({ children }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (user.mustChangePassword && location.pathname !== '/account') return <Navigate to="/account" replace />;
  if (!isAdmin) {
    return (
      <div className="card mx-auto mt-6 max-w-xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-coral-100 text-coral-500"><ShieldAlert className="h-7 w-7" aria-hidden /></span>
        <h1 className="mt-4 text-2xl font-semibold">Administrators only</h1>
        <p className="mt-2 text-sm text-ink-500">Booking, rescheduling and cancelling slots, and managing accounts, are done by laboratory administrators only.</p>
        <Button to="/" className="mt-6">Back to dashboard</Button>
      </div>
    );
  }
  return children;
}
