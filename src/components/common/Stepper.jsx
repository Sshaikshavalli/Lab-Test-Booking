import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const STEPS = ['Select Tests', 'Patient Details', 'Date & Slot', 'Review', 'Confirmed'];

/** Checkout progress bar. `current` is 1-based. The active pill glides between steps (shared layoutId). */
export default function Stepper({ current }) {
  return (
    <nav aria-label="Booking progress" className="mb-6">
      <ol className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/80 p-1.5 shadow-card backdrop-blur">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} className="relative min-w-0 flex-1" aria-current={active ? 'step' : undefined}>
              {active && <motion.span layoutId="stepper-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-lift" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span className={`relative flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap px-2 text-sm font-semibold sm:px-3 ${active ? 'text-white' : done ? 'text-brand-700' : 'text-ink-500'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${active ? 'bg-white/20' : done ? 'bg-brand-100' : 'bg-ink-100'}`}>
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
                </span>
                <span className={active ? '' : 'hidden md:inline'}>{label}</span>
                <span className="sr-only">{done ? ' (completed)' : active ? ' (current step)' : ''}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
