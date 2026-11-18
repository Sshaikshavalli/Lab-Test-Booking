/**
 * The laboratory (Bengaluru). This is a single-lab system, so no branch or locality names are used anywhere.
 *  slotCapacity – patients per hourly slot
 *  open / close – daily operating window (24h "HH:mm"); the last slot ends at `close`
 *  Edit phone / email / hours below with the real contact details.
 */
export const CITY = 'Bengaluru';
export const STATE = 'Karnataka';
export const LAB_ID = 'lab-main';

export const lab = {
  id: LAB_ID,
  name: 'Lab Test Booking',
  short: 'Bengaluru',
  phone: '080 4120 1200',
  email: 'care@labtestbooking.in',
  accreditations: ['NABL', 'CAP'],
  homeCollection: true,
  hours: 'Daily 6:00 AM – 8:00 PM', open: '06:00', close: '20:00', slotCapacity: 8,
};

/** Kept as a list so slot / booking code that looks laboratories up by id keeps working. */
export const laboratories = [lab];
export const DEFAULT_LAB_ID = LAB_ID;
export const getLabById = (id) => laboratories.find((l) => l.id === id);
export const telUrl = (l = lab) => `tel:${l.phone.replace(/\s+/g, '')}`;

/** Home collection is offered within Bengaluru: PIN codes 560001 – 560103. */
export const isBengaluruPincode = (pin) => /^560(0\d\d|10[0-3])$/.test(String(pin ?? '').trim());

/** Is the lab open right now? Returns { open, label }. */
export function openStatus(l = lab, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  if (mins >= toMin(l.open) && mins < toMin(l.close)) return { open: true, label: `Open now · closes ${fmt(l.close)}` };
  if (mins < toMin(l.open)) return { open: false, label: `Closed · opens today ${fmt(l.open)}` };
  return { open: false, label: `Closed · opens tomorrow ${fmt(l.open)}` };
}
