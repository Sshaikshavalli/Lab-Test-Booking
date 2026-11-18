import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/priceUtils';
import { CATEGORY_META } from '../tests/categoryMeta';

export default function CartItem({ test, duplicateOf, onRemove }) {
  const meta = CATEGORY_META[test.category];
  const Icon = meta.icon;
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="card p-4">
      <div className="flex items-center gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.tint}`}><Icon className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <Link to={`/tests/${test.id}`} className="font-semibold hover:text-brand-700">{test.name}</Link>
          <p className="text-xs text-ink-500">{test.code} · {test.sampleType} sample{test.fasting ? ` · fasting ${test.fastingHours}h` : ''}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold">{formatPrice(test.price)}</p>
          {test.discountPct > 0 && <s className="text-xs text-ink-300">{formatPrice(test.mrp)}</s>}
        </div>
        <button type="button" onClick={() => onRemove(test.id)} aria-label={`Remove ${test.name}`} className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 hover:bg-coral-100 hover:text-coral-500"><Trash2 className="h-4 w-4" /></button>
      </div>
      {duplicateOf && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Already included in {duplicateOf}. Removing it saves {formatPrice(test.price)}.</p>
      )}
    </motion.li>
  );
}
