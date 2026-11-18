import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarCheck, FileCheck2, FlaskConical, Timer, Sparkles, BadgePercent, Home as HomeIcon, ListChecks, Radio } from 'lucide-react';
import Button from '../../components/common/Button';
import HeroBackdrop from '../../components/common/HeroBackdrop';
import TestCard from '../tests/TestCard';
import HowItWorks from '../../components/common/HowItWorks';
import Faq from '../../components/common/Faq';
import { CATEGORIES, CONCERNS, tests } from '../../data/tests';
import { CATEGORY_META, CONCERN_ICONS } from '../tests/categoryMeta';
import { sortTests } from '../../services/testService';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../app/providers/AuthProvider';
import { useActiveLab } from '../../app/providers/LocationProvider';
import { CITY } from '../../data/laboratories';
import LocationCard from './components/LocationCard';
import { computeStats } from '../../services/bookingService';
import { asset } from '../../utils/assetUrl';

const CategoryChart = lazy(() => import('./components/CategoryChart'));

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

/** Dashboard: split hero (text 50% / lab photo 50%), KPIs, featured packages and tests. */
export default function Dashboard() {
  const { bookings } = useBookings();
  const { user, isAdmin } = useAuth();
  const { lab } = useActiveLab();
  const live = computeStats(bookings.filter((b) => b.labId === lab.id));
  const packages = sortTests(tests.filter((t) => t.kind === 'package'), 'popularity').slice(0, 3);
  const featured = sortTests(tests.filter((t) => t.kind === 'test'), 'popularity').slice(0, 3);
  const stats = [
    { icon: FlaskConical, label: 'Tests & packages', value: tests.length },
    { icon: CalendarCheck, label: 'Upcoming bookings', value: live.activeAppointments },
    { icon: FileCheck2, label: 'Completed reports', value: live.completedReports },
    { icon: Timer, label: 'Avg turnaround', value: `${live.avgTurnaroundHours}h` },
  ];

  return (
    <div className="space-y-12">
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 text-white shadow-lift">
        <HeroBackdrop theme="ocean" />

        {/* Flexbox split: the text column and the photo column are each exactly 50% on md+ screens. */}
        <div className="relative flex flex-col md:flex-row md:items-stretch">
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col justify-center px-6 pb-8 pt-10 sm:px-12 md:w-1/2 md:py-14">
            <motion.p variants={item} className="chip self-start border border-white/20 bg-white/10 text-white backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-aqua-300" aria-hidden />{CITY} · live slots</motion.p>
            <motion.h1 variants={item} id="hero-title" className="mt-4 text-4xl font-extrabold leading-[1.05] !text-white sm:text-5xl lg:text-6xl">Lab tests in {CITY}, booked in minutes.</motion.h1>
            <motion.p variants={item} className="mt-4 max-w-md text-base text-white/80">{isAdmin ? 'Add tests to the cart, arrange a slot, and reschedule or cancel any upcoming booking.' : 'Explore tests, packages and prices. Bookings, rescheduling and cancellations are handled by the lab admin.'}</motion.p>
            <motion.div variants={item} className="mt-7 flex flex-wrap gap-3">
              <Button to="/tests" size="lg" className="!bg-white !text-ink-950 hover:!bg-aqua-300">{isAdmin ? 'New booking' : 'Open test catalogue'}<ArrowRight className="h-5 w-5" /></Button>
              <Button to={user ? '/bookings' : '/login'} variant="ghost" size="lg" className="border border-white/30 !text-white backdrop-blur hover:!bg-white/15">{user ? 'Bookings' : 'Lab admin login'}</Button>
            </motion.div>
          </motion.div>

          {/* Photo column: 50% wide, as tall as the text beside it, image covers it edge to edge. */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6, delay: .1 }}
            className="relative h-72 w-full shrink-0 sm:h-96 md:h-auto md:min-h-[26rem] md:w-1/2">
            <img src={asset('lab-hero.jpg')} alt="Laboratory bench with a microscope, sample tubes and petri dishes" width="735" height="1033" fetchpriority="high"
              className="absolute inset-0 h-full w-full object-cover object-[50%_40%]" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent md:bg-gradient-to-r md:from-[#08586b]/50 md:via-transparent md:to-transparent" />
          </motion.div>
        </div>

        <div className="relative px-6 pb-7 pt-6 sm:px-12" aria-label="Summary" role="group">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/70"><Radio className="h-3.5 w-3.5 text-emerald-400" aria-hidden />Demo data · updates across tabs</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(({ icon: I, label, value }) => (
              <div key={label} className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-aqua-300"><I className="h-5 w-5" aria-hidden /></span>
                <div><p className="font-display text-2xl font-extrabold leading-none">{value}</p><p className="mt-1 text-xs text-white/70">{label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ul aria-label="Highlights" className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-ink-700">
        {[[Timer, 'Reports in as little as 6 hours'], [HomeIcon, 'Home or lab collection across Bengaluru'], [BadgePercent, 'Checkups from 30% off'], [ListChecks, 'Clear parameter lists']].map(([I, t]) => (
          <li key={t} className="flex items-center gap-2"><I className="h-4 w-4 text-brand-600" aria-hidden />{t}</li>
        ))}
      </ul>

      <LocationCard />

      <section aria-labelledby="cats">
        <h2 id="cats" className="text-2xl">Explore by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => { const m = CATEGORY_META[c]; const I = m.icon; return (
            <Link key={c} to={`/tests?category=${encodeURIComponent(c)}`} className="card group flex flex-col items-start gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lift">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${m.tint}`}><I className="h-5 w-5" aria-hidden /></span>
              <span className="text-sm font-semibold leading-tight">{c}</span>
            </Link>); })}
        </div>
      </section>

      <section aria-labelledby="concerns">
        <h2 id="concerns" className="text-2xl">Shop by health concern</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {CONCERNS.map((c) => { const I = CONCERN_ICONS[c]; return (
            <Link key={c} to={`/tests?concern=${encodeURIComponent(c)}`} className="flex min-h-[48px] items-center gap-2 rounded-full border border-ink-100 bg-white px-5 text-sm font-semibold shadow-card transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-700">
              <I className="h-4 w-4 text-brand-600" aria-hidden />{c}
            </Link>); })}
        </div>
      </section>

      <section aria-labelledby="featured">
        <div className="mb-4 flex items-end justify-between"><h2 id="featured" className="text-2xl">Popular tests</h2><Link to="/tests" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link></div>
        <div className="grid gap-4 md:grid-cols-3">{featured.map((t) => <TestCard key={t.id} test={t} />)}</div>
      </section>

      <section aria-labelledby="pkgs">
        <div className="mb-4 flex items-end justify-between"><h2 id="pkgs" className="text-2xl">Featured health packages</h2><Link to="/tests?category=Health%20Packages" className="text-sm font-semibold text-brand-700 hover:underline">All packages</Link></div>
        <div className="grid gap-4 md:grid-cols-3">{packages.map((t) => <TestCard key={t.id} test={t} />)}</div>
      </section>

      <HowItWorks />

      <section aria-labelledby="chart" className="card p-6">
        <h2 id="chart" className="text-xl font-semibold">Diagnostics analytics</h2>
        <p className="mb-2 text-sm text-ink-500">Live appointment volume</p>
        <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}><CategoryChart /></Suspense>
      </section>
      <Faq />
    </div>
  );
}
