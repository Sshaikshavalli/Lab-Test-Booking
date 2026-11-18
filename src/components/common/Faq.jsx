import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
  ['Who can book a test?', 'Only the laboratory admin. Patients don’t have accounts — they call or visit the lab in Bengaluru and the admin books the test and arranges the slot.'],
  ['How do I get an admin account?', 'Admin accounts are created only by an existing lab admin (Lab Admins page). A new admin signs in with a temporary password and chooses their own.'],
  ['Do I need to fast before a test?', 'Each test page lists fasting hours and preparation steps. Preparation can vary, so confirm with the laboratory or your clinician if unsure.'],
  ['Can a booking be rescheduled or cancelled?', 'Yes — by the lab admin, any time before the patient is checked in and before the slot starts. A cancelled or moved booking frees its seat immediately.'],
  ['Is home sample collection available?', 'Yes, anywhere in Bengaluru. Home collection is free on orders of ₹500 or more and ₹150 below that. Lab visits are always free.'],
  ['How is the price calculated?', 'Each test or package shows its price with the MRP struck through. The cart shows the MRP total, the discount and the amount payable, plus any home-collection fee.'],
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section aria-labelledby="faq">
      <h2 id="faq" className="text-2xl font-semibold">Frequently asked</h2>
      <div className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {ITEMS.map(([q, a], i) => (
          <div key={q}>
            <h3 className="font-sans">
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 text-left text-sm font-semibold hover:bg-sand-50">
                {q}<ChevronDown className={`h-4 w-4 shrink-0 transition ${open === i ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            </h3>
            {open === i && <p className="px-5 pb-4 text-sm text-ink-500">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
