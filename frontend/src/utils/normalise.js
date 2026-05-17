export function normaliseItems(items) {
  return items.map((item) => {
    let normalisedPrice = null;
    let unitType = item.unitType || 'per_item';

    const price = parseFloat(item.rawPrice) || 0;
    const qty = parseFloat(item.quantity) || 1;
    const wg = item.weightGrams;
    const vm = item.volumeMl;

    if (wg && wg > 0) {
      normalisedPrice = parseFloat(((price / wg) * 100).toFixed(4));
      unitType = 'per_100g';
    } else if (vm && vm > 0) {
      normalisedPrice = parseFloat(((price / vm) * 100).toFixed(4));
      unitType = 'per_100ml';
    } else if (qty > 1) {
      normalisedPrice = parseFloat((price / qty).toFixed(4));
      unitType = 'per_item';
    } else {
      normalisedPrice = parseFloat(price.toFixed(4));
      unitType = 'per_item';
    }

    return { ...item, normalisedPrice, unitType };
  });
}
