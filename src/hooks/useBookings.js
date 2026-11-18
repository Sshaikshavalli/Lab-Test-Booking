import { useSyncExternalStore } from 'react';
import {
  getBookings, getSlotOverrides, subscribeBookings, createBooking, cancelBooking, rescheduleBooking,
  advanceStatus, operatorCancel, setSlotCapacity,
} from '../services/bookingService';

/** Live bookings + slot overrides; re-renders whenever any tab changes them. */
export function useBookings() {
  const bookings = useSyncExternalStore(subscribeBookings, getBookings, getBookings);
  const overrides = useSyncExternalStore(subscribeBookings, getSlotOverrides, getSlotOverrides);
  return { bookings, overrides, createBooking, cancelBooking, rescheduleBooking, advanceStatus, operatorCancel, setSlotCapacity };
}
