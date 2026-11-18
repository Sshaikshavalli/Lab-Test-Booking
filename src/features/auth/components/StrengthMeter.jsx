import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { passwordStrength } from '../passwordStrength';

const COLORS = ['#e6eef0', '#f4694a', '#f2a93b', '#2fbfa9', '#0b8776'];

/** Four-segment meter plus a live checklist. */
export default function StrengthMeter({ password }) {
  const { score, label, checks } = passwordStrength(password);
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <motion.span className="block h-full rounded-full" initial={false} animate={{ width: score >= n ? '100%' : '0%', backgroundColor: COLORS[score] }} transition={{ duration: .3 }} />
            </span>
          ))}
        </div>
        <span className="w-14 text-right text-xs font-semibold" style={{ color: score ? COLORS[score] : '#a9bcc2' }}>{label || '—'}</span>
      </div>
      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => (
          <li key={c.id} className={`flex items-center gap-1.5 text-xs transition-colors ${c.ok ? 'text-brand-700' : 'text-ink-500'}`}>
            {c.ok ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : <Circle className="h-3 w-3 shrink-0 opacity-50" aria-hidden />}
            <span>{c.label}<span className="sr-only">{c.ok ? ' — met' : ' — not met yet'}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
