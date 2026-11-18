import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link, Navigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { BadgeCheck, CalendarClock, CalendarX2, ShieldCheck } from 'lucide-react';
import AuroraBackground from './components/AuroraBackground';
import { useAuth } from '../../app/providers/AuthProvider';
import { tests } from '../../data/tests';
import { prefersReducedMotion } from '../../utils/webgl';
import { asset } from '../../utils/assetUrl';

// The 3D scene is loaded on demand so the form paints immediately over the CSS backdrop.
const AuthScene = lazy(() => import('./components/AuthScene'));

const COPY = {
  login: { title: <>Lab admin <em className="not-italic text-brand-400">sign in.</em></>, sub: 'Only laboratory administrators sign in. Book tests, arrange slots, reschedule and cancel — all from one place.' },
  setup: { title: <>Set up your laboratory <em className="not-italic text-coral-400">in one minute.</em></>, sub: 'Create the first administrator account. From then on, only admins can add other admins, book slots, reschedule and cancel.' },
};
const FEATURES = [
  { icon: BadgeCheck, text: 'Book tests for patients in a few clicks' },
  { icon: CalendarClock, text: 'Arrange live slots for the next 14 days' },
  { icon: CalendarX2, text: 'Reschedule or cancel any upcoming booking' },
];

/** Shared shell for /login and /setup: the 3D scene and card persist while the form content transitions. */
export default function AuthLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();
  const page = location.pathname.startsWith('/setup') ? 'setup' : 'login';
  const mode = page === 'setup' ? 'signup' : 'login'; // colour mood of the 3D scene
  const from = location.state?.from ?? '/';

  const pointer = useRef({ x: 0, y: 0 });
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-1, 1], [3, -3]), { stiffness: 120, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-1, 1], [-4, 4]), { stiffness: 120, damping: 18 });
  const calm = prefersReducedMotion();

  useEffect(() => {
    const move = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.current.x = x; pointer.current.y = y; mx.set(x); my.set(y);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [mx, my]);

  if (user) return <Navigate to={from} replace />;

  const copy = COPY[page];
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#06122b] text-white">
      <AuroraBackground />
      <Suspense fallback={null}><AuthScene mode={mode} pointer={pointer} /></Suspense>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06122b]/75 via-[#06122b]/10 to-transparent lg:from-[#06122b]/70 lg:via-transparent" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* brand & message */}
        <section className="hidden max-w-md flex-col gap-8 lg:flex" aria-label="About Lab Test Booking">
          <Link to="/" className="flex w-fit items-center gap-3" aria-label="Lab Test Booking home">
            <img src={asset('favicon.svg')} alt="" className="h-11 w-11" />
            <span className="font-display text-2xl font-bold">Lab Test <span className="text-brand-400">Booking</span></span>
          </Link>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .25 }}>
              <p className="font-display text-4xl font-semibold leading-[1.12] tracking-tight xl:text-[2.9rem]" role="presentation">{copy.title}</p>
              <p className="mt-4 max-w-sm text-base text-white/70">{copy.sub}</p>
            </motion.div>
          </AnimatePresence>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: I, text }, i) => (
              <motion.li key={text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .25 + i * .08 }} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 backdrop-blur"><I className="h-4 w-4 text-brand-200" aria-hidden /></span>{text}
              </motion.li>
            ))}
          </ul>
          <div className="flex gap-3">
            {[[tests.length, 'tests & packages'], ['Bengaluru', 'lab'], ['6 h', 'fastest reports']].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <p className="font-display text-2xl font-semibold leading-none">{n}</p><p className="mt-1 text-xs text-white/65">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* card */}
        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <Link to="/" className="mb-5 flex items-center justify-center gap-2.5 lg:hidden" aria-label="Lab Test Booking home">
            <img src={asset('favicon.svg')} alt="" className="h-9 w-9" /><span className="font-display text-xl font-bold">Lab Test <span className="text-brand-400">Booking</span></span>
          </Link>
          <motion.div style={calm ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1300 }} initial={{ opacity: 0, y: 28, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 190, damping: 24 }}>
            <div className="rounded-[28px] bg-gradient-to-br from-brand-400/70 via-white/30 to-coral-400/60 p-px shadow-[0_40px_90px_-24px_rgba(0,0,0,.7)]">
              <div className="relative overflow-hidden rounded-[27px] bg-white/[.93] p-6 text-ink-900 backdrop-blur-2xl sm:p-8">
                <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-200/50 blur-3xl" />
                <p className="relative mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700"><ShieldCheck className="h-4 w-4" aria-hidden />Lab admin access</p>
                <div className="relative">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .22 }}>
                      {outlet}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
          <p className="mt-5 text-center text-xs text-white/55"><Link to="/" className="underline-offset-2 hover:underline">← Back to the test catalogue</Link></p>
        </div>
      </div>
    </div>
  );
}
