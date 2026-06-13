const router = require('express').Router();
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { scanReceipt, confirmReceipt, getReceipts, getReceiptById } = require('../controllers/receiptController');

router.post('/scan', upload.single('receipt'), scanReceipt);
router.post('/confirm', validate('confirmReceipt'), confirmReceipt);
router.post('/', validate('confirmReceipt'), confirmReceipt);
router.get('/', getReceipts);
router.get('/:id', getReceiptById);

module.exports = router;
