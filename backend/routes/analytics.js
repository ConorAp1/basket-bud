const router = require('express').Router();
const { getSummary, getByShop, getByCategory, getCheapestShop, getPriceTrends } = require('../controllers/analyticsController');

router.get('/summary', getSummary);
router.get('/by-shop', getByShop);
router.get('/by-category', getByCategory);
router.get('/cheapest-shop', getCheapestShop);
router.get('/price-trends/:productId', getPriceTrends);

module.exports = router;
