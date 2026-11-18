import { describe, expect, it } from 'vitest';
import { CITY, DEFAULT_LAB_ID, getLabById, isBengaluruPincode, laboratories, lab, openStatus } from '../../src/data/laboratories';

describe('the Bengaluru laboratory', () => {
  it('is a single laboratory in Bengaluru with no locality or branch names', () => {
    expect(CITY).toBe('Bengaluru');
    expect(laboratories).toHaveLength(1);
    expect(getLabById(DEFAULT_LAB_ID)).toBe(lab);
    const text = JSON.stringify(lab);
    for (const area of ['Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'Hebbal']) expect(text).not.toContain(area);
    expect(lab.address).toBeUndefined();
  });
  it('accepts Bengaluru PIN codes for home collection only', () => {
    expect(isBengaluruPincode('560001')).toBe(true);
    expect(isBengaluruPincode('560103')).toBe(true);
    expect(isBengaluruPincode('560104')).toBe(false);
    expect(isBengaluruPincode('500001')).toBe(false);
    expect(isBengaluruPincode('')).toBe(false);
  });
  it('reports whether the lab is open right now', () => {
    const l = { open: '07:00', close: '19:00' };
    const at = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };
    expect(openStatus(l, at(10)).open).toBe(true);
    expect(openStatus(l, at(10)).label).toMatch(/closes 7:00 PM/);
    expect(openStatus(l, at(5)).label).toMatch(/opens today 7:00 AM/);
    expect(openStatus(l, at(20)).label).toMatch(/opens tomorrow/);
  });
});
