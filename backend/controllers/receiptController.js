const { extractText } = require('../services/ocrService');
const { parseReceiptText } = require('../services/parserService');
const { normaliseItems } = require('../services/normalisationService');
const ReceiptModel = require('../models/Receipt');
const PriceRecordModel = require('../models/PriceRecord');
const ShopModel = require('../models/Shop');
const logger = require('../utils/logger');

async function scanReceipt(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No receipt image provided' });
  }

  const { text, confidence, lines } = await extractText(req.file.path);
  const parsedItems = parseReceiptText(text);
  const normalisedItems = normaliseItems(parsedItems);

  res.json({
    receiptId: null,
    imagePath: req.file.path,
    rawText: text,
    confidence: Math.round(confidence),
    items: normalisedItems,
  });
}

async function confirmReceipt(req, res) {
  const { shopName, shopLocation, scannedAt, items, totalAmount } = req.body;

  const shop = shopName ? await ShopModel.findOrCreate({ name: shopName, location: shopLocation }) : null;

  const receipt = await ReceiptModel.create({
    shopId: shop ? shop.id : null,
    scannedAt: scannedAt || new Date(),
    imagePath: req.body.imagePath || 'manual',
    rawOcrText: req.body.rawText || null,
    totalAmount: totalAmount || null,
  });

  const priceRecords = items.map((item) => ({
    receiptId: receipt.id,
    productId: item.productId || null,
    shopId: shop ? shop.id : null,
    rawName: item.rawName,
    rawPrice: item.rawPrice,
    quantity: item.quantity || 1,
    weightGrams: item.weightGrams || null,
    unitType: item.unitType || 'unknown',
    normalisedPrice: item.normalisedPrice || null,
    scannedAt: scannedAt || new Date(),
  }));

  const savedRecords = await PriceRecordModel.createMany(priceRecords);

  logger.info('Receipt confirmed and saved', { receiptId: receipt.id, itemCount: savedRecords.length });

  res.status(201).json({
    receipt,
    priceRecords: savedRecords,
    shop,
  });
}

async function getReceipts(req, res) {
  const { shopId, limit, offset } = req.query;
  const receipts = await ReceiptModel.findAll({
    shopId: shopId ? parseInt(shopId) : undefined,
    limit: limit ? parseInt(limit) : 20,
    offset: offset ? parseInt(offset) : 0,
  });
  res.json(receipts);
}

async function getReceiptById(req, res) {
  const receipt = await ReceiptModel.findById(req.params.id);
  if (!receipt) return res.status(404).json({ error: `Receipt ${req.params.id} not found` });

  const items = await PriceRecordModel.findByReceiptId(receipt.id);
  res.json({ ...receipt, items });
}

module.exports = { scanReceipt, confirmReceipt, getReceipts, getReceiptById };
