const router = require('express').Router();
const upload = require('../middleware/upload');
const { scanReceipt, confirmReceipt, getReceipts, getReceiptById } = require('../controllers/receiptController');

router.post('/scan', upload.single('receipt'), scanReceipt);
router.post('/', confirmReceipt);
router.get('/', getReceipts);
router.get('/:id', getReceiptById);

module.exports = router;
