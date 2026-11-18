import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, PiggyBank, Sparkles } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import CartItem from './CartItem';
import { useCart } from '../../app/providers/CartProvider';
import { tests as allTests } from '../../data/tests';
import { FREE_COLLECTION_ABOVE, HOME_FEE, formatPrice, packageAdvice, sumMrp, sumSavings } from '../../utils/priceUtils';
import PriceSummary from '../../components/common/PriceSummary';

export default function BookingCart() {
  const { selectedTests, indicativeTotal, remove, add, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const empty = selectedTests.length === 0;
  const mrp = sumMrp(selectedTests);
  const mrpSavings = sumSavings(selectedTests);
  const { suggestions, duplicates } = packageAdvice(selectedTests, allTests);
  const dupByTest = Object.fromEntries(duplicates.map((d) => [d.testId, d.packageName]));
  const dupSaving = duplicates.reduce((s, d) => s + d.saving, 0);

  const swap = ({ pkg, replaces }) => {
    replaces.forEach(remove);
    add(pkg.id);
    toast(`Switched to ${pkg.name}`);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Test Catalogue', to: '/tests' }, { label: 'Booking cart' }]} />
      <Stepper current={1} />
      <h1 className="text-3xl font-semibold">Booking cart</h1>

      {empty ? (
        <div className="card mt-6 grid place-items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ShoppingBag className="h-8 w-8" /></span>
          <h2 className="mt-4 text-xl font-semibold">Nothing selected yet</h2>
          <p className="mt-1 text-sm text-ink-500">Add at least one test to start a booking.</p>
          <Button to="/tests" className="mt-5">Open test catalogue</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {selectedTests.map((t) => <CartItem key={t.id} test={t} duplicateOf={dupByTest[t.id]} onRemove={remove} />)}
              </AnimatePresence>
            </ul>

            {suggestions.map((s) => (
              <motion.div key={s.pkg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                <p className="flex items-start gap-2.5 text-sm text-brand-900"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  <span><b>Save {formatPrice(s.saving)}</b> — {s.pkg.name} ({formatPrice(s.pkg.price)}) already covers {s.replaces.length} of your tests.</span></p>
                <Button size="sm" onClick={() => swap(s)}>Switch to package</Button>
              </motion.div>
            ))}
          </div>

          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h2 className="font-sans text-base font-semibold">Booking summary</h2>
            <PriceSummary className="mt-4" count={selectedTests.length} mrp={mrp} subtotal={indicativeTotal} />
            <p className="mt-3 text-xs text-ink-500">Lab visit is free. Home collection is free on {formatPrice(FREE_COLLECTION_ABOVE)} or more, otherwise {formatPrice(HOME_FEE)} — added when you choose it.</p>
            {(mrpSavings > 0 || dupSaving > 0) && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"><PiggyBank className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                You’re saving {formatPrice(mrpSavings)} on MRP{dupSaving > 0 ? `, and could save ${formatPrice(dupSaving)} more by removing duplicated tests` : ''}.</p>
            )}
            <Button className="mt-5 w-full" disabled={empty} onClick={() => navigate('/patient')}>Continue to patient details<ArrowRight className="h-4 w-4" /></Button>
            <button type="button" onClick={clear} className="mt-3 w-full text-center text-xs font-semibold text-ink-500 hover:text-coral-500">Clear selection</button>
          </aside>
        </div>
      )}
    </div>
  );
}
