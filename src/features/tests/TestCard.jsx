import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Plus, Clock, UtensilsCrossed, TestTube2, Flame, Package, ListChecks } from 'lucide-react';
import Button from '../../components/common/Button';
import { useCart } from '../../app/providers/CartProvider';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../app/providers/AuthProvider';
import { formatPrice } from '../../utils/priceUtils';
import { CATEGORY_META, AVAILABILITY_SHORT } from './categoryMeta';

const SLOT_TEXT = { 'Available today': 'text-emerald-700', 'Next-day slot': 'text-sky-700', 'Limited slots': 'text-amber-700' };

/** Small labelled fact (sample, fasting, slot). */
function Fact({ icon: Icon, label, value, tone = 'text-ink-900', warn = false }) {
  return (
    <div className={`rounded-2xl px-2.5 py-2.5 ${warn ? 'bg-amber-50' : 'bg-sand-50'}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</p>
      <p className={`mt-0.5 truncate text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function TestCard({ test, view = 'grid' }) {
  const { has, toggle } = useCart();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const selected = isAdmin && has(test.id);
  const meta = CATEGORY_META[test.category];
  const Icon = meta.icon;
  const list = view === 'list';
  const pkg = test.kind === 'package';

  const onToggle = () => {
    toggle(test.id);
    toast(selected ? `Removed ${test.name}` : `Added ${test.name}`, selected ? 'info' : 'success');
  };

  return (
    <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      aria-label={test.name}
      className={`group relative flex overflow-hidden rounded-3xl border bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift ${list ? 'flex-col sm:flex-row' : 'flex-col'} ${selected ? 'border-brand-500 ring-2 ring-brand-500/40' : 'border-ink-100 hover:border-brand-200'}`}>
      <span aria-hidden className={`shrink-0 bg-gradient-to-r ${meta.grad} ${list ? 'h-1.5 sm:h-auto sm:w-1.5 sm:bg-gradient-to-b' : 'h-1.5'}`} />

      <div className={`flex flex-1 p-5 ${list ? 'flex-col gap-4 lg:flex-row lg:items-center lg:gap-6' : 'flex-col'}`}>
        <div className={`flex items-start gap-3.5 ${list ? 'lg:w-[32%]' : ''}`}>
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${meta.tint}`}><Icon className="h-6 w-6" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-bold leading-snug"><Link to={`/tests/${test.id}`} className="after:absolute after:inset-0 after:content-['']">{test.name}</Link></h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
              <span>{test.category}</span>
              <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-700">{test.code}</span>
              {pkg && <span className="chip !px-2 !py-0.5 bg-brand-50 text-brand-700"><Package className="h-3 w-3" aria-hidden />Package</span>}
            </p>
          </div>
        </div>

        {selected && <span className="absolute right-0 top-1.5 flex items-center gap-1 rounded-bl-xl bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white"><Check className="h-3 w-3" aria-hidden />In cart</span>}

        <div className={`grid grid-cols-3 gap-2 ${list ? 'lg:w-[34%]' : 'mt-4'}`}>
          <Fact icon={TestTube2} label="Sample" value={test.sampleType} />
          <Fact icon={UtensilsCrossed} label="Fasting" value={test.fasting ? `${test.fastingHours} h` : 'Not needed'} warn={test.fasting} tone={test.fasting ? 'text-amber-800' : 'text-ink-900'} />
          <Fact icon={Clock} label="Slot" value={AVAILABILITY_SHORT[test.availability]} tone={SLOT_TEXT[test.availability]} />
        </div>

        {!list && (
          <>
            <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-700"><ListChecks className="h-4 w-4" aria-hidden />{test.paramCount} parameter{test.paramCount === 1 ? '' : 's'} included</p>
            <p className="mb-4 mt-1.5 line-clamp-2 text-sm text-ink-500">{test.description}</p>
          </>
        )}
        {list && <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 lg:w-32"><ListChecks className="h-4 w-4 shrink-0" aria-hidden />{test.paramCount} parameter{test.paramCount === 1 ? '' : 's'}</p>}

        <div className={`relative z-10 flex items-center justify-between gap-3 ${list ? 'lg:ml-auto lg:w-64' : 'mt-auto border-t border-ink-100 pt-4'}`}>
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-2xl font-extrabold text-ink-950">{formatPrice(test.price)}</span>
              {test.discountPct > 0 && <s className="text-sm text-ink-300"><span className="sr-only">Original price </span>{formatPrice(test.mrp)}</s>}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[11px]">
              {test.discountPct > 0 && <span className="chip !px-1.5 !py-0.5 bg-emerald-50 text-emerald-700">{test.discountPct}% off</span>}
              {test.popularity >= 85 && <span className="flex items-center gap-1 font-medium text-coral-500"><Flame className="h-3 w-3" aria-hidden />Popular</span>}
            </p>
          </div>
          {!isAdmin ? <Button to={`/tests/${test.id}`} variant="secondary" className="relative z-10">Details</Button> : (
            <Button variant={selected ? 'secondary' : 'primary'} onClick={onToggle} aria-pressed={selected} aria-label={`${selected ? 'Remove' : 'Add'} ${test.name} ${selected ? 'from' : 'to'} cart`}>
              {selected ? <><Check className="h-4 w-4" />Added</> : <><Plus className="h-4 w-4" />Add</>}
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
export default memo(TestCard);
