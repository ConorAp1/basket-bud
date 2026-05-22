// Ordering matters: first match wins.
// - Drinks before Produce: "orange juice" → Drinks, not Produce
// - Household before Bakery: "toilet roll" → Household, not Bakery ("roll")
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
  Household: ['toilet roll', 'toilet paper', 'kitchen roll', 'kitchen towel',
               'tissue', 'washing', 'detergent', 'soap', 'shampoo', 'conditioner',
               'bin bag', 'foil', 'cling film', 'bleach', 'spray', 'sponge',
               'dishwasher', 'fabric'],
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
};

function suggestCategory(name) {
  const lower = (name || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}

module.exports = { suggestCategory, CATEGORY_KEYWORDS };
