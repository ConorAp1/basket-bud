const analyticsService = require('../services/analyticsService');

async function getSummary(req, res) {
  const { startDate, endDate } = req.query;
  const summary = await analyticsService.getSpendSummary({ startDate, endDate });
  res.json(summary);
}

async function getByShop(req, res) {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getSpendByShop({ startDate, endDate });
  res.json(data);
}

async function getByCategory(req, res) {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getSpendByCategory({ startDate, endDate });
  res.json(data);
}

async function getCheapestShop(req, res) {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ error: 'productId query parameter is required' });

  const data = await analyticsService.getCheapestShopByProduct(productId);
  res.json(data);
}

async function getPriceTrends(req, res) {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getPriceTrends(req.params.productId, { startDate, endDate });
  res.json(data);
}

module.exports = { getSummary, getByShop, getByCategory, getCheapestShop, getPriceTrends };
