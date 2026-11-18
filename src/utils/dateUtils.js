import { addDays, differenceInYears, format, isBefore, isValid, parse, parseISO, startOfDay } from 'date-fns';

/** Number of days (including today) that can be booked in advance. */
export const BOOKING_WINDOW_DAYS = 14;

export const toISODate = (d) => format(d, 'yyyy-MM-dd');
export const fromISODate = (s) => parse(s, 'yyyy-MM-dd', new Date());

/** The bookable dates, today first. */
export function getBookingDates(from = new Date(), days = BOOKING_WINDOW_DAYS) {
  const start = startOfDay(from);
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export const isPastDate = (isoDate, now = new Date()) => isBefore(fromISODate(isoDate), startOfDay(now));

export function formatLongDate(isoDate) {
  const d = fromISODate(isoDate);
  return isValid(d) ? format(d, 'EEE, d MMM yyyy') : '—';
}
export function formatShortDate(isoDate) {
  const d = fromISODate(isoDate);
  return isValid(d) ? format(d, 'd MMM') : '—';
}
export function formatDateTime(iso) {
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'd MMM yyyy, h:mm a') : '—';
}

/** Age in whole years for an ISO date of birth, or null when invalid. */
export function ageFromDob(dob, now = new Date()) {
  const d = fromISODate(dob);
  return isValid(d) ? differenceInYears(now, d) : null;
}

/** "08:30" -> Date on the given ISO day. */
export function slotStart(isoDate, time) {
  return parse(`${isoDate} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
}

export function formatTime12(time) {
  const d = parse(time, 'HH:mm', new Date());
  return isValid(d) ? format(d, 'h:mm a') : time;
}
