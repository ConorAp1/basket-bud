const logger = require('../utils/logger');

/**
 * Normalise a price to a standard unit.
 * Returns { normalisedPrice, unitType } where unitType is one of:
 *   per_item | per_100g | per_kg | per_litre | per_100ml | unknown
 */
function normalisePrice({ rawPrice, quantity = 1, weightGrams, volumeMl, unitType }) {
  const totalPrice = rawPrice;

  try {
    if (weightGrams && weightGrams > 0) {
      const pricePer100g = (totalPrice / weightGrams) * 100;
      return { normalisedPrice: parseFloat(pricePer100g.toFixed(4)), unitType: 'per_100g' };
    }

    if (volumeMl && volumeMl > 0) {
      const pricePer100ml = (totalPrice / volumeMl) * 100;
      return { normalisedPrice: parseFloat(pricePer100ml.toFixed(4)), unitType: 'per_100ml' };
    }

    if (unitType === 'per_kg') {
      const pricePer100g = totalPrice / 10;
      return { normalisedPrice: parseFloat(pricePer100g.toFixed(4)), unitType: 'per_100g' };
    }

    if (unitType === 'per_litre') {
      const pricePer100ml = totalPrice / 10;
      return { normalisedPrice: parseFloat(pricePer100ml.toFixed(4)), unitType: 'per_100ml' };
    }

    if (quantity > 1) {
      const pricePerItem = totalPrice / quantity;
      return { normalisedPrice: parseFloat(pricePerItem.toFixed(4)), unitType: 'per_item' };
    }

    return { normalisedPrice: parseFloat(totalPrice.toFixed(4)), unitType: 'per_item' };
  } catch (err) {
    logger.warn('Normalisation failed, marking as unknown', { rawPrice, weightGrams, volumeMl, error: err.message });
    return { normalisedPrice: null, unitType: 'unknown' };
  }
}

function normaliseItems(items) {
  return items.map((item) => {
    const { normalisedPrice, unitType } = normalisePrice(item);
    return { ...item, normalisedPrice, unitType };
  });
}

module.exports = { normalisePrice, normaliseItems };
