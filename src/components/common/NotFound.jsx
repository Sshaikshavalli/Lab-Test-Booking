import { SearchX } from 'lucide-react';
import Button from './Button';

export default function NotFound({ title = 'Page not found', text = 'The page you are looking for does not exist or has moved.' }) {
  return (
    <div className="card mx-auto mt-6 max-w-xl p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><SearchX className="h-7 w-7" aria-hidden /></span>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">{text}</p>
      <div className="mt-6 flex justify-center gap-3"><Button to="/tests">Test catalogue</Button><Button to="/bookings" variant="secondary">My bookings</Button></div>
    </div>
  );
}
