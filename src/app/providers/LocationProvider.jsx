import { createContext, useContext, useMemo } from 'react';
import { lab, LAB_ID } from '../../data/laboratories';

const LocationContext = createContext(null);
const value = { lab, labId: LAB_ID };

/** The one Bengaluru laboratory. Kept as a context so screens read `useActiveLab()` the same way everywhere. */
export function LocationProvider({ children }) {
  const v = useMemo(() => value, []);
  return <LocationContext.Provider value={v}>{children}</LocationContext.Provider>;
}

export function useActiveLab() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useActiveLab must be used inside <LocationProvider>');
  return ctx;
}
