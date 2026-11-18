import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Clock, FlaskConical, RotateCcw, TestTube2, UtensilsCrossed, Wallet } from 'lucide-react';
import { CATEGORIES, SAMPLE_TYPES, AVAILABILITY, tests } from '../../data/tests';

const CEIL = Math.ceil(Math.max(...tests.map((t) => t.price)) / 500) * 500;
const count = (key, val) => tests.filter((t) => t[key] === val).length;

/** One filter chip that opens a small panel under it. Closes on outside click and Escape. */
function Filter({ icon: Icon, label, active, children }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700 hover:border-brand-400'}`}>
        <Icon className="h-4 w-4" aria-hidden />{label}
        {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{active}</span>}
        <ChevronDown className={`h-4 w-4 text-ink-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="dialog" aria-label={`${label} filter`} initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .14 }}
            className="absolute left-0 top-full z-40 mt-2 w-72 max-w-[85vw] rounded-2xl border border-ink-100 bg-white p-2 shadow-lift">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Option = ({ checked, onChange, label, count: n, radio = false, name }) => (
  <label className={`flex min-h-[40px] cursor-pointer items-center gap-3 rounded-xl px-3 text-sm transition ${checked ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-ink-100/60'}`}>
    <input type={radio ? 'radio' : 'checkbox'} name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-brand-600" />
    <span className="flex-1">{label}</span>
    {n != null && <span className="text-xs text-ink-500">{n}</span>}
    {checked && !radio && <Check className="h-4 w-4" aria-hidden />}
  </label>
);

/**
 * Horizontal filter toolbar for desktop: the type switch and one dropdown per filter, so results keep the full width.
 * (Phones and tablets use the drawer in TestCatalogue.)
 */
export default function FilterBar({ filters, update, toggleIn, reset, activeCount }) {
  const fastingValue = filters.fastingOnly ? 'yes' : filters.noFastingOnly ? 'no' : 'any';
  const price = filters.maxPrice ?? CEIL;

  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Filter tests">
      <div role="radiogroup" aria-label="Tests or checkups" className="inline-flex rounded-xl bg-ink-100 p-1 text-sm font-semibold">
        {[['all', 'All'], ['test', 'Tests'], ['package', 'Checkups']].map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={filters.kind === v} onClick={() => update({ kind: v })}
            className={`min-h-[36px] rounded-lg px-4 transition ${filters.kind === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}>{l}</button>
        ))}
      </div>

      <span aria-hidden className="mx-1 hidden h-6 w-px bg-ink-100 xl:block" />

      <Filter icon={FlaskConical} label="Category" active={filters.categories.length}>
        {CATEGORIES.map((c) => <Option key={c} label={c} n={count('category', c)} checked={filters.categories.includes(c)} onChange={() => toggleIn('categories', c)} />)}
      </Filter>
      <Filter icon={TestTube2} label="Sample" active={filters.sampleTypes.length}>
        {SAMPLE_TYPES.map((s) => <Option key={s} label={s} n={count('sampleType', s)} checked={filters.sampleTypes.includes(s)} onChange={() => toggleIn('sampleTypes', s)} />)}
      </Filter>
      <Filter icon={UtensilsCrossed} label="Fasting" active={fastingValue === 'any' ? 0 : 1}>
        {[['any', 'Any'], ['yes', 'Fasting required'], ['no', 'No fasting']].map(([v, l]) => (
          <Option key={v} radio name="fasting-bar" label={l} checked={fastingValue === v} onChange={() => update({ fastingOnly: v === 'yes', noFastingOnly: v === 'no' })} />
        ))}
      </Filter>
      <Filter icon={Clock} label="Availability" active={filters.availability.length}>
        {AVAILABILITY.map((a) => <Option key={a} label={a} n={count('availability', a)} checked={filters.availability.includes(a)} onChange={() => toggleIn('availability', a)} />)}
      </Filter>
      <Filter icon={Wallet} label="Price" active={filters.maxPrice != null ? 1 : 0}>
        <div className="p-3">
          <label htmlFor="bar-max-price" className="flex items-baseline justify-between text-sm"><span>Up to</span><b className="font-display text-lg">₹{price.toLocaleString('en-IN')}{price >= CEIL && '+'}</b></label>
          <input id="bar-max-price" type="range" min={100} max={CEIL} step={100} value={price} onChange={(e) => update({ maxPrice: Number(e.target.value) >= CEIL ? null : Number(e.target.value) })} className="mt-3 w-full accent-brand-600" />
          <div className="mt-1 flex justify-between text-[11px] text-ink-500"><span>₹100</span><span>₹{CEIL.toLocaleString('en-IN')}</span></div>
        </div>
      </Filter>

      <button type="button" onClick={reset} disabled={!activeCount} className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:text-ink-300 disabled:hover:bg-transparent">
        <RotateCcw className="h-4 w-4" aria-hidden />Reset{activeCount > 0 && ` (${activeCount})`}
      </button>
    </div>
  );
}
