import { describe, it, expect } from 'vitest';
import { collectionFee, bookingTotal, sumPrices, sumMrp, sumSavings, packageAdvice, HOME_FEE, FREE_COLLECTION_ABOVE } from '../../src/utils/priceUtils';

describe('home collection fee', () => {
  it('is free for a lab visit, whatever the subtotal', () => {
    expect(collectionFee(100, 'lab')).toBe(0);
    expect(collectionFee(0, 'lab')).toBe(0);
  });
  it('charges the flat fee for home collection below the free threshold', () => {
    expect(collectionFee(FREE_COLLECTION_ABOVE - 1, 'home')).toBe(HOME_FEE);
  });
  it('is free from the threshold upwards and for an empty cart', () => {
    expect(collectionFee(FREE_COLLECTION_ABOVE, 'home')).toBe(0);
    expect(collectionFee(1500, 'home')).toBe(0);
    expect(collectionFee(0, 'home')).toBe(0);
  });
  it('adds the fee to the payable total', () => {
    expect(bookingTotal(300, 'home')).toBe(300 + HOME_FEE);
    expect(bookingTotal(300, 'lab')).toBe(300);
    expect(bookingTotal(500, 'home')).toBe(500);
  });
});

describe('sums', () => {
  const items = [{ price: 400, mrp: 500 }, { price: 250 }];
  it('adds prices, MRPs (falling back to price) and savings', () => {
    expect(sumPrices(items)).toBe(650);
    expect(sumMrp(items)).toBe(750);
    expect(sumSavings(items)).toBe(100);
  });
  it('treats an empty list as zero', () => {
    expect(sumPrices([])).toBe(0);
    expect(sumMrp([])).toBe(0);
  });
});

describe('package advice', () => {
  const all = [
    { id: 't-cbc', kind: 'test', price: 300 }, { id: 't-fbs', kind: 'test', price: 150 }, { id: 't-lipid', kind: 'test', price: 400 },
    { id: 't-urine', kind: 'test', price: 120 }, { id: 't-kft', kind: 'test', price: 500 },
    { id: 'p-basic', name: 'Basic', kind: 'package', price: 900 },
  ];
  it('suggests a package that replaces two or more selected tests for less', () => {
    const { suggestions } = packageAdvice([all[0], all[2], all[4]], all);
    expect(suggestions[0].pkg.id).toBe('p-basic');
    expect(suggestions[0].saving).toBe(300);
  });
  it('flags tests already covered by a package in the cart', () => {
    const { duplicates } = packageAdvice([all[5], all[1]], all);
    expect(duplicates.map((d) => d.testId)).toEqual(['t-fbs']);
  });
});
