const ProductModel = require('../models/Product');
const PriceRecordModel = require('../models/PriceRecord');
const ProductMergeModel = require('../models/ProductMerge');

async function getProducts(req, res) {
  const { category, search, limit, offset } = req.query;
  const products = await ProductModel.findAll({
    category,
    search,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  });
  res.json(products);
}

async function getProductById(req, res) {
  const product = await ProductModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: `Product ${req.params.id} not found` });
  res.json(product);
}

async function updateProduct(req, res) {
  const updated = await ProductModel.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: `Product ${req.params.id} not found` });
  res.json(updated);
}

async function compareProduct(req, res) {
  const product = await ProductModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: `Product ${req.params.id} not found` });

  const relatedIds = await ProductMergeModel.getRelatedProductIds(req.params.id);
  const allIds = [parseInt(req.params.id, 10), ...relatedIds];
  const priceHistory = await PriceRecordModel.findByProducts(allIds);

  const byShop = {};
  for (const record of priceHistory) {
    if (!byShop[record.shop_name]) {
      byShop[record.shop_name] = { shopName: record.shop_name, prices: [], bestPrice: null };
    }
    byShop[record.shop_name].prices.push({
      price: record.normalised_price_per_unit,
      unitType: record.unit_type,
      scannedAt: record.scanned_at,
    });
  }

  for (const shop of Object.values(byShop)) {
    const validPrices = shop.prices.filter((p) => p.price !== null);
    if (validPrices.length) {
      shop.bestPrice = Math.min(...validPrices.map((p) => p.price));
    }
  }

  res.json({ product, comparison: Object.values(byShop) });
}

async function searchProducts(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  const results = await ProductModel.fuzzySearch(q);
  res.json(results);
}

async function getCategories(req, res) {
  const categories = await ProductModel.getCategories();
  res.json(categories);
}

module.exports = { getProducts, getProductById, updateProduct, compareProduct, searchProducts, getCategories };
