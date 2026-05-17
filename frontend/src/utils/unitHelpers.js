const UNIT_LABELS = {
  per_item: 'per item',
  per_100g: 'per 100g',
  per_kg: 'per kg',
  per_litre: 'per litre',
  per_100ml: 'per 100ml',
  unknown: '',
};

export function formatUnit(unitType) {
  return UNIT_LABELS[unitType] || unitType;
}

export function formatNormalisedPrice(price, unitType) {
  if (price === null || price === undefined) return '—';
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  const label = formatUnit(unitType);
  return label ? `${formatted} ${label}` : formatted;
}
