export function formatCurrency(amount, currency = 'GBP') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
}

export function formatPence(pence) {
  return formatCurrency(pence / 100);
}
