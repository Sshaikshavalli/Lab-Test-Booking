const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** Format an price, e.g. 1499 -> "₹1,499" */
export const formatPrice = (n) => fmt.format(Number(n) || 0);

/** Sum the price of a list of test objects. */
export const sumPrices = (items) => items.reduce((s, i) => s + (Number(i?.price) || 0), 0);

/** Sum of the struck-through MRPs (falls back to the price when a test has no discount). */
export const sumMrp = (items) => items.reduce((s, i) => s + (Number(i?.mrp) || Number(i?.price) || 0), 0);

/** Total saved versus the struck-through MRP across a list of tests/packages. */
export const sumSavings = (items) => items.reduce((s, i) => s + Math.max(0, (Number(i?.mrp) || 0) - (Number(i?.price) || 0)), 0);

/** Individual tests each package already covers (used for bundle suggestions and duplicate warnings). */
export const PACKAGE_COVERS = {
  'p-basic': ['t-cbc', 't-fbs', 't-lipid', 't-urine', 't-kft'],
  'p-diab': ['t-fbs', 't-hba1c', 't-kft', 't-microalb', 't-lipid'],
  'p-heart': ['t-lipid', 't-crp', 't-hba1c', 't-lft', 't-kft'],
  'p-full': ['t-cbc', 't-lipid', 't-lft', 't-kft', 't-thy', 't-vitd', 't-b12', 't-hba1c', 't-urine'],
};

/**
 * Package savings calculator.
 *  - suggestions: packages NOT in the cart that would replace >= 2 selected tests for less money.
 *  - duplicates:  tests already included in a package that is in the cart (paying twice).
 */
export function packageAdvice(selected, allItems) {
  const ids = new Set(selected.map((t) => t.id));
  const price = (id) => allItems.find((t) => t.id === id)?.price ?? 0;
  const suggestions = [];
  const duplicates = [];
  for (const pkg of allItems.filter((t) => t.kind === 'package')) {
    const covers = PACKAGE_COVERS[pkg.id] ?? [];
    const overlap = covers.filter((id) => ids.has(id));
    if (ids.has(pkg.id)) {
      overlap.forEach((id) => duplicates.push({ packageId: pkg.id, packageName: pkg.name, testId: id, saving: price(id) }));
    } else if (overlap.length >= 2) {
      const separate = overlap.reduce((s, id) => s + price(id), 0);
      if (separate > pkg.price) suggestions.push({ pkg, replaces: overlap, saving: separate - pkg.price });
    }
  }
  return { suggestions: suggestions.sort((a, b) => b.saving - a.saving), duplicates };
}

/** Home sample collection: free from this subtotal upwards, a flat fee below it. Lab visits are always free. */
export const HOME_FEE = 150;
export const FREE_COLLECTION_ABOVE = 500;
export const collectionFee = (subtotal, collection) => (collection === 'home' && subtotal > 0 && subtotal < FREE_COLLECTION_ABOVE ? HOME_FEE : 0);

/** Amount payable: tests/packages plus any home-collection fee. */
export const bookingTotal = (subtotal, collection) => subtotal + collectionFee(subtotal, collection);
