import { useCallback, useState } from 'react';
import { clearDraft, getDraft, saveDraft } from '../services/bookingService';

/** The in-progress booking (patient, lab, date, slot, collection). Persists across steps and reloads. */
export function useBookingDraft() {
  const [draft, setDraft] = useState(() => getDraft());
  const update = useCallback((patch) => setDraft(saveDraft(patch)), []);
  const reset = useCallback(() => { clearDraft(); setDraft({}); }, []);
  return { draft, update, reset };
}
