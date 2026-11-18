import { motion } from 'framer-motion';
import { MousePointerClick, CalendarClock, Home, FileText } from 'lucide-react';

const STEPS = [
  { icon: MousePointerClick, title: 'Add tests to the cart', text: 'The lab admin picks tests or packages and sees the price, MRP and discount straight away.' },
  { icon: CalendarClock, title: 'Arrange the slot', text: 'Choose a date and time from live slot availability for the next 14 days.' },
  { icon: Home, title: 'Lab visit or home', text: 'Collect at the lab, or at the patient’s home anywhere in Bengaluru.' },
  { icon: FileText, title: 'Reschedule or cancel', text: 'Change the time or cancel from the booking at any point before check-in.' },
];

/** 4-step explainer, reused on the dashboard and test details. */
export default function HowItWorks({ className = '' }) {
  return (
    <section aria-labelledby="how" className={className}>
      <h2 id="how" className="text-2xl font-semibold">How booking works</h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: I, title, text }, i) => (
          <motion.li key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="card relative p-5">
            <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-brand-100" aria-hidden>{i + 1}</span>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><I className="h-5 w-5" aria-hidden /></span>
            <h3 className="mt-3 font-sans text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-ink-500">{text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
