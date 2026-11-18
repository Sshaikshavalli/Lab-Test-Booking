import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/** Colour moods per section of the app. Blobs cross-fade when you move between sections. */
const TONES = {
  blue: ['rgba(23,100,232,.22)', 'rgba(34,211,238,.18)', 'rgba(124,92,255,.12)'],
  ocean: ['rgba(20,184,166,.26)', 'rgba(56,189,248,.20)', 'rgba(52,211,153,.16)'],
  twilight: ['rgba(168,85,247,.24)', 'rgba(236,72,153,.18)', 'rgba(99,102,241,.16)'],
  iris: ['rgba(112,88,245,.26)', 'rgba(14,165,233,.18)', 'rgba(217,70,239,.14)'],
};
const DOTS = { blue: '23,100,232', ocean: '13,148,136', twilight: '147,51,234', iris: '112,88,245' };
const BASES = {
  blue: 'bg-[linear-gradient(180deg,#eaf2ff_0%,#f5f8ff_42%,#e9f0fd_100%)]',
  ocean: 'bg-[linear-gradient(180deg,#e3f6f6_0%,#f3fbfa_42%,#dff3f3_100%)]',
  twilight: 'bg-[linear-gradient(180deg,#f3eaff_0%,#fbf6ff_42%,#f1e6ff_100%)]',
  iris: 'bg-[linear-gradient(180deg,#eeeaff_0%,#f6f4ff_42%,#e9e5ff_100%)]',
};
export const BOOKING_PATH = /^\/(cart|patient|schedule|review|confirmation|bookings)/;
/** Which colour section a page belongs to: drives the page background and the `brand` colour variables. */
export function sectionFor(path) {
  if (path === '/') return 'dashboard';
  if (path.startsWith('/tests')) return 'catalogue';
  if (BOOKING_PATH.test(path)) return 'booking';
  return undefined;
}
const TONE_OF = { dashboard: 'ocean', catalogue: 'twilight', booking: 'iris' };
export const toneFor = (path) => TONE_OF[sectionFor(path)] ?? 'blue';

const Hex = (p) => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M24 4l17 10v20L24 44 7 34V14z" /></svg>;
const Plus = (p) => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M24 10v28M10 24h28" /></svg>;
const Molecule = (p) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M14 46l18-28 20 22M14 46l38-6" /><circle cx="14" cy="46" r="6" fill="currentColor" fillOpacity=".15" /><circle cx="32" cy="18" r="7" fill="currentColor" fillOpacity=".15" /><circle cx="52" cy="40" r="5" fill="currentColor" fillOpacity=".15" />
  </svg>
);
const Helix = (p) => (
  <svg viewBox="0 0 40 120" fill="none" strokeWidth="1.6" strokeLinecap="round" {...p}>
    <path d="M8 4c24 14-24 28 0 42s-24 28 0 42 -24 24 0 30" stroke="currentColor" /><path d="M32 4c-24 14 24 28 0 42s24 28 0 42 24 24 0 30" stroke="currentColor" strokeOpacity=".6" />
    {[16, 32, 46, 60, 74, 90, 106].map((y) => <path key={y} d={`M12 ${y}h16`} stroke="currentColor" strokeOpacity=".35" />)}
  </svg>
);

const SHAPES = [
  { C: Hex, cls: 'left-[4%] top-[14%] h-14 w-14 text-brand-500/40 animate-drift-a', d: 0 },
  { C: Molecule, cls: 'right-[6%] top-[10%] h-24 w-24 text-aqua-500/35 animate-drift-b', d: 2 },
  { C: Plus, cls: 'left-[16%] top-[58%] h-8 w-8 text-coral-500/40 animate-spin-slow', d: 0 },
  { C: Helix, cls: 'left-[2%] top-[70%] hidden h-40 w-14 text-brand-600/30 animate-drift-b sm:block', d: 1 },
  { C: Hex, cls: 'right-[26%] top-[80%] h-10 w-10 text-coral-500/35 animate-drift-a', d: 4 },
  { C: Plus, cls: 'right-[34%] top-[8%] h-6 w-6 text-brand-500/45 animate-spin-slow', d: 2 },
  { C: Molecule, cls: 'left-[30%] top-[88%] hidden h-20 w-20 text-brand-500/30 animate-drift-a md:block', d: 5 },
  { C: Helix, cls: 'right-[3%] top-[62%] hidden h-36 w-12 text-aqua-500/30 animate-drift-a lg:block', d: 3 },
];

/** Fixed, decorative background for every page: drifting colour glow, a faint grid and floating molecule shapes. */
export default function AppBackground() {
  const { pathname } = useLocation();
  const tone = toneFor(pathname);
  const [a, b, c] = TONES[tone];
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${BASES[tone]} print:hidden`}>
      <AnimatePresence initial={false}>
        <motion.div key={tone} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
          <div className="absolute -left-[10%] -top-[18%] h-[58vmax] w-[58vmax] animate-aurora-a rounded-full blur-3xl will-change-transform" style={{ background: `radial-gradient(circle, ${a}, transparent 62%)` }} />
          <div className="absolute -right-[12%] top-[12%] h-[52vmax] w-[52vmax] animate-aurora-b rounded-full blur-3xl will-change-transform" style={{ background: `radial-gradient(circle, ${b}, transparent 62%)` }} />
          <div className="absolute bottom-[-24%] left-[24%] h-[48vmax] w-[48vmax] animate-aurora-c rounded-full blur-3xl will-change-transform" style={{ background: `radial-gradient(circle, ${c}, transparent 62%)` }} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 opacity-60 [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_50%_20%,#000_0%,transparent_70%)]" style={{ backgroundImage: `radial-gradient(rgba(${DOTS[tone]},.22) 1px, transparent 1.4px)` }} />
      <div className="absolute inset-x-[-25%] bottom-0 h-[46%] opacity-[.35]" style={{ perspective: '600px' }}><div className="floor-grid absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(${DOTS[tone]},.35) 1px, transparent 1px), linear-gradient(90deg, rgba(${DOTS[tone]},.35) 1px, transparent 1px)` }} /></div>
      {SHAPES.map(({ C, cls, d }, i) => <C key={i} className={`absolute ${cls}`} style={{ animationDelay: `${-d * 2.3}s` }} />)}
    </div>
  );
}
