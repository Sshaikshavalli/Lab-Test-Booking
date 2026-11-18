import { useMemo, useState } from 'react';
import { addDays, format, subDays } from 'date-fns';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORIES } from '../../../data/tests';
import { CATEGORY_META } from '../../tests/categoryMeta';
import { useBookings } from '../../../hooks/useBookings';
import { useActiveLab } from '../../../app/providers/LocationProvider';
import { toISODate } from '../../../utils/dateUtils';

const axis = { fontSize: 11, fill: '#66748f' };

/** Live analytics: appointments per day (smooth gradient area) or tests booked per category (bars). */
export default function CategoryChart() {
  const { bookings } = useBookings();
  const { labId } = useActiveLab();
  const [view, setView] = useState('day');
  const live = useMemo(() => bookings.filter((b) => b.labId === labId && b.status !== 'Cancelled'), [bookings, labId]);

  const byDay = useMemo(() => {
    const start = subDays(new Date(), 7);
    return Array.from({ length: 15 }, (_, i) => {
      const d = addDays(start, i);
      const iso = toISODate(d);
      return { name: format(d, 'd MMM'), count: live.filter((b) => b.date === iso).length };
    });
  }, [live]);

  const byCategory = useMemo(() => CATEGORIES.map((c) => ({
    name: c.replace('Clinical ', 'Clin. ').replace('Health ', ''), full: c,
    count: live.reduce((s, b) => s + b.items.filter((i) => i.category === c).length, 0),
  })), [live]);

  const data = view === 'day' ? byDay : byCategory;
  const summary = data.map((d) => `${d.full ?? d.name} ${d.count}`).join(', ');

  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl bg-ink-100/70 p-1" role="group" aria-label="Chart view">
        {[['day', 'Bookings by day'], ['category', 'Tests by category']].map(([v, label]) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
            className={`min-h-[40px] rounded-lg px-3.5 text-sm font-semibold transition ${view === v ? 'bg-white text-brand-700 shadow-card' : 'text-ink-700'}`}>{label}</button>
        ))}
      </div>
      <div className="h-64" role="img" aria-label={`${view === 'day' ? 'Area' : 'Bar'} chart. ${summary}`}>
        <ResponsiveContainer>
          {view === 'day' ? (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2b7fff" stopOpacity={0.45} /><stop offset="100%" stopColor="#2b7fff" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#e6ecf6" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axis} interval={1} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
              <Tooltip formatter={(v) => [v, 'Bookings']} />
              <Area type="monotone" dataKey="count" stroke="#1764e8" strokeWidth={2.5} fill="url(#gArea)" isAnimationActive={false} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e6ecf6" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axis} interval={0} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
              <Tooltip cursor={{ fill: 'rgba(23,100,232,.08)' }} formatter={(v) => [v, 'Tests booked']} labelFormatter={(_, p) => p?.[0]?.payload.full} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} isAnimationActive={false}>{data.map((d) => <Cell key={d.full} fill={CATEGORY_META[d.full].dot} />)}</Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
