const router = require('express').Router();
const { getProducts, getProductById, updateProduct, compareProduct, searchProducts } = require('../controllers/productController');
const { getMerges, createMerge, deleteMerge } = require('../controllers/mergeController');

router.get('/search', searchProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.get('/:id/compare', compareProduct);
router.get('/:id/merges', getMerges);
router.post('/:id/merge', createMerge);
router.delete('/:id/merge/:mergeId', deleteMerge);

module.exports = router;
