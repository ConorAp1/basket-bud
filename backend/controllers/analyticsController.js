const analyticsService = require('../services/analyticsService');

async function getTopProducts(req, res) {
  const { startDate, endDate, limit } = req.query;
  const data = await analyticsService.getTopProductsBySpend({
    startDate,
    endDate,
    limit: limit ? parseInt(limit, 10) : 10,
  });
  res.json(data);
}

async function getShopComparison(req, res) {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getShopComparisonScore({ startDate, endDate });
  res.json(data);
}

async function getPriceAlerts(req, res) {
  const data = await analyticsService.getPriceTrendAlerts();
  res.json(data);
}

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

module.exports = {
  getSummary,
  getByShop,
  getByCategory,
  getCheapestShop,
  getPriceTrends,
  getTopProducts,
  getShopComparison,
  getPriceAlerts,
};
