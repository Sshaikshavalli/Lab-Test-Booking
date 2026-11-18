import { formatPrice } from '../../utils/priceUtils';

/**
 * Price breakdown used by the cart, the review step and booking details.
 *  mrp       – sum of struck-through MRPs        subtotal – sum of selling prices
 *  fee       – home-collection fee (0 = free)    collection – 'home' | 'lab' | undefined (cart: not chosen yet)
 */
export default function PriceSummary({ count, mrp, subtotal, fee = 0, collection, className = '' }) {
  const discount = Math.max(0, mrp - subtotal);
  const total = subtotal + fee;
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      {count != null && <div className="flex justify-between"><dt className="text-ink-500">Tests selected</dt><dd className="font-medium">{count}</dd></div>}
      <div className="flex justify-between"><dt className="text-ink-500">Total MRP</dt><dd className={discount ? 'text-ink-500 line-through decoration-ink-300' : 'font-medium'}>{formatPrice(mrp)}</dd></div>
      {discount > 0 && <div className="flex justify-between"><dt className="text-ink-500">Discount</dt><dd className="font-medium text-emerald-700">− {formatPrice(discount)}</dd></div>}
      {collection && <div className="flex justify-between"><dt className="text-ink-500">{collection === 'home' ? 'Home collection' : 'Lab visit'}</dt><dd className={`font-medium ${fee ? '' : 'text-emerald-700'}`}>{fee ? formatPrice(fee) : 'Free'}</dd></div>}
      <div className="flex items-baseline justify-between border-t border-ink-100 pt-3"><dt className="font-semibold">Total payable</dt><dd className="font-display text-3xl font-extrabold text-ink-950">{formatPrice(total)}</dd></div>
    </dl>
  );
}
