/** Human-readable booking references: LTB-<year>-<4+ digit sequence>, e.g. LTB-2026-1021 */
const RE = /^LTB-(\d{4})-(\d{4,})$/;

export const isValidReference = (ref) => RE.test(String(ref ?? ''));

/** Next unused reference given the existing bookings (sequence continues from the highest one). */
export function nextReference(existing = [], now = new Date()) {
  const year = now.getFullYear();
  const max = existing.reduce((m, b) => {
    const hit = RE.exec(b.reference ?? '');
    return hit ? Math.max(m, Number(hit[2])) : m;
  }, 1000);
  return `LTB-${year}-${String(max + 1).padStart(4, '0')}`;
}
