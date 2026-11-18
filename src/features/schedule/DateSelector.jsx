import { useRef } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBookingDates, toISODate } from '../../utils/dateUtils';

/** 14-day horizontal picker. Past dates never appear; today is the first chip. */
export default function DateSelector({ value, onChange, idPrefix = 'date' }) {
  const dates = getBookingDates();
  const scroller = useRef(null);
  const nudge = (dir) => scroller.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <div className="relative">
      <button type="button" aria-label="Earlier dates" onClick={() => nudge(-1)} className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-ink-100 bg-white shadow-card hover:border-brand-400 md:grid"><ChevronLeft className="h-4 w-4" /></button>
      <div ref={scroller} role="radiogroup" aria-label="Choose a date" className="flex snap-x gap-2 overflow-x-auto px-1 py-1.5 [scrollbar-width:none]">
        {dates.map((d, i) => {
          const iso = toISODate(d);
          const on = iso === value;
          return (
            <button key={iso} id={`${idPrefix}-${iso}`} type="button" role="radio" aria-checked={on} onClick={() => onChange(iso)}
              className={`relative flex min-h-[76px] w-[68px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border text-center transition ${on ? 'border-transparent text-white' : 'border-ink-100 bg-white hover:border-brand-400'}`}>
              {on && <motion.span layoutId={`${idPrefix}-pill`} className="absolute inset-0 rounded-2xl bg-brand-600 shadow-lift" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative text-[11px] font-semibold uppercase tracking-wider opacity-80">{i === 0 ? 'Today' : format(d, 'EEE')}</span>
              <span className="relative font-display text-2xl font-semibold leading-none">{format(d, 'd')}</span>
              <span className="relative text-[11px] opacity-80">{format(d, 'MMM')}</span>
            </button>
          );
        })}
      </div>
      <button type="button" aria-label="Later dates" onClick={() => nudge(1)} className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-ink-100 bg-white shadow-card hover:border-brand-400 md:grid"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}
