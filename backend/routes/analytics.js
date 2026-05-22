const router = require('express').Router();
const {
  getSummary,
  getByShop,
  getByCategory,
  getCheapestShop,
  getPriceTrends,
  getTopProducts,
  getShopComparison,
  getPriceAlerts,
} = require('../controllers/analyticsController');

router.get('/summary', getSummary);
router.get('/by-shop', getByShop);
router.get('/by-category', getByCategory);
router.get('/cheapest-shop', getCheapestShop);
router.get('/price-trends/:productId', getPriceTrends);
router.get('/top-products', getTopProducts);
router.get('/shop-comparison', getShopComparison);
router.get('/price-alerts', getPriceAlerts);

module.exports = router;
