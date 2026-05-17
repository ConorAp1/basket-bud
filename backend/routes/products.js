const router = require('express').Router();
const { getProducts, getProductById, updateProduct, compareProduct, searchProducts } = require('../controllers/productController');

router.get('/search', searchProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.get('/:id/compare', compareProduct);

module.exports = router;
