const logger = require('../utils/logger');

// Drinks is checked before Produce so "orange juice" → Drinks, not Produce.
const CATEGORY_KEYWORDS = {
  Dairy:     ['milk', 'cheese', 'butter', 'cream', 'yoghurt', 'yogurt', 'cheddar',
               'mozzarella', 'brie', 'feta', 'stilton', 'halloumi', 'skimmed',
               'semi-skimmed', 'clotted', 'mascarpone', 'ricotta', 'kefir'],
  Drinks:    ['juice', 'water', 'cola', 'lemonade', 'beer', 'wine', 'cider',
               'coffee', 'tea', 'squash', 'smoothie', 'kombucha', 'sparkling',
               'energy drink', 'protein shake', 'oat milk', 'almond milk'],
  Produce:   ['apple', 'banana', 'orange', 'tomato', 'potato', 'carrot', 'lettuce',
               'spinach', 'broccoli', 'cabbage', 'onion', 'pepper', 'cucumber',
               'mushroom', 'avocado', 'lemon', 'lime', 'grape', 'strawberr',
               'raspberr', 'blueberr', 'mango', 'pineapple', 'kiwi', 'melon',
               'courgette', 'aubergine', 'celery', 'parsnip', 'leek', 'asparagus'],
  Bakery:    ['bread', 'roll', 'bun', 'loaf', 'bagel', 'croissant', 'muffin',
               'cake', 'biscuit', 'scone', 'pastry', 'sourdough', 'wrap', 'pitta',
               'crumpet', 'waffle', 'ciabatta', 'focaccia', 'brownie', 'doughnut'],
  Meat:      ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'sausage', 'mince',
               'steak', 'turkey', 'ham', 'salami', 'chorizo', 'duck', 'veal',
               'venison', 'gammon', 'rasher', 'burger', 'meatball'],
  Seafood:   ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'prawn', 'shrimp',
               'mackerel', 'sardine', 'crab', 'lobster', 'mussel', 'oyster',
               'seabass', 'tilapia', 'plaice', 'scallop', 'squid'],
  Frozen:    ['frozen', 'ice cream', 'sorbet', 'oven chips', 'fish finger',
               'pizza', 'ready meal', 'battered'],
  Snacks:    ['crisps', 'nuts', 'chocolate', 'sweets', 'candy', 'popcorn',
               'pretzel', 'protein bar', 'cereal bar', 'flapjack', 'pringles',
               'doritos', 'raisins', 'trail mix'],
  Household: ['washing', 'detergent', 'soap', 'shampoo', 'conditioner',
               'toilet paper', 'tissue', 'kitchen roll', 'bin bag', 'foil',
               'cling film', 'bleach', 'spray', 'sponge', 'dishwasher', 'fabric'],
};

function suggestCategory(name) {
  const lower = (name || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}

// Patterns to detect prices: £1.99, 1.99, £ 1.99
const PRICE_RE = /£?\s*(\d+\.\d{2})/;
// Weight patterns: 500g, 1.5kg, 1kg, 250g
const WEIGHT_RE = /(\d+(?:\.\d+)?)\s*(kg|g)\b/i;
// Volume patterns: 1l, 500ml, 1.5l
const VOLUME_RE = /(\d+(?:\.\d+)?)\s*(ml|l)\b/i;
// Quantity patterns: 3x, x3, 3 for, qty 3
const QTY_RE = /(?:(\d+)\s*x|x\s*(\d+)|(\d+)\s+for\b|qty\s*(\d+))/i;
// Lines to skip — headers, totals, shop metadata
const SKIP_RE = /^\s*$|total|subtotal|balance|change|cash|card|vat|receipt|thank|visit|member|tel:|date:|time:|shop:|store:/i;
// Discount / offer lines
const DISCOUNT_RE = /saving|discount|offer|loyalty|clubcard|nectar|^-£/i;

function parseLine(line) {
  const trimmed = line.trim();

  if (SKIP_RE.test(trimmed) || DISCOUNT_RE.test(trimmed)) return null;

  const priceMatch = trimmed.match(PRICE_RE);
  if (!priceMatch) return null;

  const price = parseFloat(priceMatch[1]);
  if (price <= 0 || price > 1000) return null;

  // Remove the price portion to get the product name
  const nameRaw = trimmed.replace(PRICE_RE, '').trim().replace(/\s+/g, ' ');

  const weightMatch = nameRaw.match(WEIGHT_RE);
  const volumeMatch = nameRaw.match(VOLUME_RE);
  const qtyMatch = nameRaw.match(QTY_RE);

  let weightGrams = null;
  let volumeMl = null;
  let quantity = 1;
  let unitType = 'per_item';

  if (weightMatch) {
    const [, amount, unit] = weightMatch;
    weightGrams = unit.toLowerCase() === 'kg' ? Math.round(parseFloat(amount) * 1000) : parseInt(amount, 10);
    unitType = 'per_100g';
  } else if (volumeMatch) {
    const [, amount, unit] = volumeMatch;
    volumeMl = unit.toLowerCase() === 'l' ? Math.round(parseFloat(amount) * 1000) : parseInt(amount, 10);
    unitType = 'per_100ml';
  }

  if (qtyMatch) {
    const rawQty = qtyMatch[1] || qtyMatch[2] || qtyMatch[3] || qtyMatch[4];
    quantity = parseInt(rawQty, 10);
  }

  // Clean product name — remove weight/volume/qty annotations
  const cleanName = nameRaw
    .replace(WEIGHT_RE, '')
    .replace(VOLUME_RE, '')
    .replace(QTY_RE, '')
    .replace(/[£\d.]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanName.length < 2) return null;

  return {
    rawName: cleanName,
    rawPrice: price,
    quantity,
    weightGrams,
    volumeMl,
    unitType,
    suggestedCategory: suggestCategory(cleanName),
    uncertain: false,
  };
}

function parseReceiptText(rawText) {
  logger.info('Parsing receipt text', { lines: rawText.split('\n').length });

  const lines = rawText.split('\n');
  const items = [];

  for (const line of lines) {
    try {
      const item = parseLine(line);
      if (item) items.push(item);
    } catch (err) {
      logger.warn('Failed to parse line', { line, error: err.message });
    }
  }

  logger.info('Receipt parsing complete', { itemsFound: items.length });
  return items;
}

module.exports = { parseReceiptText, parseLine, suggestCategory, CATEGORY_KEYWORDS };
