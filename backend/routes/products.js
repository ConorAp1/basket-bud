const router = require('express').Router();
const validate = require('../middleware/validate');
const { getProducts, getProductById, updateProduct, compareProduct, searchProducts, getCategories } = require('../controllers/productController');
const { getMerges, createMerge, deleteMerge } = require('../controllers/mergeController');

router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', validate('updateProduct'), updateProduct);
router.get('/:id/compare', compareProduct);
router.get('/:id/merges', getMerges);
router.post('/:id/merge', createMerge);
router.delete('/:id/merge/:mergeId', deleteMerge);

module.exports = router;
