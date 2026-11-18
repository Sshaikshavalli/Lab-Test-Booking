import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, SearchX, X, ArrowRight, Info } from 'lucide-react';
import HeroBackdrop from '../../components/common/HeroBackdrop';
import FilterBar from './FilterBar';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import TestCard from './TestCard';
import TestFilters from './TestFilters';
import { useTests } from '../../hooks/useTests';
import { useCart } from '../../app/providers/CartProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { SORT_OPTIONS } from '../../services/testService';
import { formatPrice } from '../../utils/priceUtils';
import { CONCERNS, tests as allTests } from '../../data/tests';
import { CONCERN_ICONS } from './categoryMeta';

export default function TestCatalogue() {
  const { filters, update, toggleIn, reset, sort, setSort, results, activeCount } = useTests();
  const { count: cartCount, indicativeTotal } = useCart();
  const { isAdmin } = useAuth();
  const count = isAdmin ? cartCount : 0; // only administrators build bookings
  const [view, setView] = useState('grid');
  const [drawer, setDrawer] = useState(false);

  const pills = [
    ...filters.categories.map((v) => ({ k: `c-${v}`, label: v, off: () => toggleIn('categories', v) })),
    ...filters.concerns.map((v) => ({ k: `h-${v}`, label: v, off: () => toggleIn('concerns', v) })),
    ...filters.sampleTypes.map((v) => ({ k: `s-${v}`, label: `${v} sample`, off: () => toggleIn('sampleTypes', v) })),
    ...filters.availability.map((v) => ({ k: `a-${v}`, label: v, off: () => toggleIn('availability', v) })),
    ...(filters.fastingOnly ? [{ k: 'f1', label: 'Fasting required', off: () => update({ fastingOnly: false }) }] : []),
    ...(filters.noFastingOnly ? [{ k: 'f0', label: 'No fasting', off: () => update({ noFastingOnly: false }) }] : []),
    ...(filters.maxPrice != null ? [{ k: 'p', label: `≤ ₹${filters.maxPrice}`, off: () => update({ maxPrice: null }) }] : []),
    ...(filters.kind !== 'all' ? [{ k: 'k', label: filters.kind === 'package' ? 'Packages' : 'Tests only', off: () => update({ kind: 'all' }) }] : []),
  ];
  const filterProps = { filters, update, toggleIn, reset, activeCount };

  return (
    <div className={count ? 'pb-28' : ''}>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Test Catalogue' }]} />

      <section aria-labelledby="catalogue-title" className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 px-6 py-9 text-white shadow-lift sm:px-10 sm:py-12">
        <HeroBackdrop theme="azure" />
        <div className="relative max-w-3xl">
          <p className="chip border border-white/20 bg-white/10 text-xs font-bold tracking-[.18em] text-aqua-300 backdrop-blur">TEST CATALOGUE</p>
          <h1 id="catalogue-title" className="mt-4 text-3xl font-extrabold leading-[1.1] !text-white sm:text-5xl">Your health journey starts with the right test.</h1>
          <p className="mt-3 bg-gradient-to-r from-aqua-300 via-white to-brand-200 bg-clip-text font-display text-2xl font-extrabold text-transparent sm:text-3xl">Explore. Compare. Book.</p>
          <p className="mt-4 max-w-2xl text-sm text-white/80 sm:text-base">Discover laboratory tests and health packages with clear information, preparation guidance and transparent demo pricing.</p>
          <div className="mt-6"><SearchBar value={filters.query} onChange={(query) => update({ query })} /></div>
        </div>
        <div className="relative mt-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Quick health-concern filter">
          {CONCERNS.map((c) => {
            const on = filters.concerns.includes(c); const I = CONCERN_ICONS[c];
            return (
              <button key={c} type="button" aria-pressed={on} onClick={() => toggleIn('concerns', c)}
                className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${on ? 'border-aqua-300 bg-aqua-300 text-ink-950' : 'border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20'}`}>
                <I className="h-4 w-4" aria-hidden />{c}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters sit in a toolbar under the hero, so the results use the full width. */}
      <div className="card mt-5 p-3 sm:p-4">
        <div className="hidden lg:block"><FilterBar {...filterProps} /></div>
        <div className="flex flex-wrap items-center gap-3 lg:mt-3 lg:border-t lg:border-ink-100 lg:pt-3">
          <p className="mr-auto text-sm text-ink-500" aria-live="polite"><b className="text-ink-950">{results.length}</b> of {allTests.length} shown</p>
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal className="h-4 w-4" />Filters{activeCount > 0 && ` (${activeCount})`}</Button>
          <label className="flex items-center gap-2 text-sm"><span className="sr-only text-ink-500 sm:not-sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !w-auto !py-2 pr-8">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <div role="group" aria-label="Layout" className="hidden rounded-xl bg-ink-100 p-1 sm:flex">
            {[['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']].map(([v, I, l]) => (
              <button key={v} type="button" aria-label={l} aria-pressed={view === v} onClick={() => setView(v)} className={`grid h-9 w-9 place-items-center rounded-lg ${view === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'}`}><I className="h-4 w-4" /></button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        Preparation notes are general guidance. Please confirm your instructions with the laboratory or your clinician.
      </p>

      <section aria-label="Results" className="mt-5">
        {pills.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
            {pills.map((p) => (
              <li key={p.k}><button type="button" onClick={p.off} className="chip !py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100">{p.label}<X className="h-3.5 w-3.5" aria-label="remove filter" /></button></li>
            ))}
          </ul>
        )}

        {results.length === 0 ? (
          <div className="card grid place-items-center px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ink-100 text-ink-500"><SearchX className="h-8 w-8" /></span>
            <h2 className="mt-4 text-xl font-semibold">No tests match your search</h2>
            <p className="mt-1 max-w-sm text-sm text-ink-500">Try a different keyword, or remove some filters to widen the results.</p>
            <Button className="mt-5" onClick={reset}>Clear all filters</Button>
          </div>
        ) : (
          <motion.div layout className={`grid gap-5 ${view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            <AnimatePresence>
              {results.map((t) => <TestCard key={t.id} test={t} view={view} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filter tests" side>
        <TestFilters {...filterProps} />
        <Button className="mt-4 w-full" onClick={() => setDrawer(false)}>Show {results.length} result{results.length === 1 ? '' : 's'}</Button>
      </Modal>

      <AnimatePresence>
        {count > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl bg-ink-950 p-3 pl-5 text-white shadow-lift ring-1 ring-white/10">
            <p className="text-sm"><b>{count}</b> selected · <span className="font-display text-lg">{formatPrice(indicativeTotal)}</span> <span className="text-xs text-ink-300">est.</span></p>
            <Link to="/cart" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-aqua-400 px-4 text-sm font-bold text-ink-950 hover:bg-aqua-300">View cart<ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
