const STYLE = {
  Confirmed: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Checked In': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Sample Collected': 'bg-amber-50 text-amber-700 ring-amber-200',
  Processing: 'bg-orange-50 text-orange-700 ring-orange-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
};
export const STATUS_DOT = {
  Confirmed: '#0284c7', 'Checked In': '#7c3aed', 'Sample Collected': '#d97706', Processing: '#ea580c', Completed: '#059669', Cancelled: '#e11d48',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`chip ring-1 ring-inset ${STYLE[status] ?? 'bg-ink-100 text-ink-700 ring-ink-300'} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[status] ?? '#66748f' }} aria-hidden />{status}
    </span>
  );
}
