const router = require('express').Router();
const { getShops, createShop } = require('../controllers/shopController');

router.get('/', getShops);
router.post('/', createShop);

module.exports = router;
