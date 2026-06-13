const analyticsService = require('../services/analyticsService');

// The web app sends ?start=&end=; accept ?startDate=&endDate= too.
function dateRange(query) {
  return {
    startDate: query.startDate || query.start,
    endDate: query.endDate || query.end,
  };
}

async function getTopProducts(req, res) {
  const { startDate, endDate } = dateRange(req.query);
  const { limit } = req.query;
  const data = await analyticsService.getTopProductsBySpend({
    startDate,
    endDate,
    limit: limit ? parseInt(limit, 10) : 10,
  });
  res.json(data);
}

async function getShopComparison(req, res) {
  const { startDate, endDate } = dateRange(req.query);
  const data = await analyticsService.getShopComparisonScore({ startDate, endDate });
  res.json(data);
}

async function getPriceAlerts(req, res) {
  const data = await analyticsService.getPriceTrendAlerts();
  res.json(data);
}

async function getSummary(req, res) {
  const { startDate, endDate } = dateRange(req.query);
  const summary = await analyticsService.getSpendSummary({ startDate, endDate });
  // Field names the dashboard expects, with the originals kept for compatibility.
  res.json({
    ...summary,
    receipts_scanned: summary.total_receipts,
    products_tracked: summary.unique_products,
  });
}

async function getByShop(req, res) {
  const { startDate, endDate } = dateRange(req.query);
  const data = await analyticsService.getSpendByShop({ startDate, endDate });
  res.json(data);
}

async function getByCategory(req, res) {
  const { startDate, endDate } = dateRange(req.query);
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
  const { startDate, endDate } = dateRange(req.query);
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
