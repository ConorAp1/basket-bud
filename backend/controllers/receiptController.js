const { extractText } = require('../services/ocrService');
const { suggestCategory } = require('../services/parserService');
const { normaliseItems } = require('../services/normalisationService');
const ReceiptModel = require('../models/Receipt');
const PriceRecordModel = require('../models/PriceRecord');
const ShopModel = require('../models/Shop');
const logger = require('../utils/logger');

// Map Claude's { name, price, quantity, unit } to the format normaliseItems expects.
function mapClaudeItem(item) {
  const u = (item.unit || 'each').toLowerCase().trim();

  let weightGrams = null;
  let volumeMl = null;
  let unitType = 'per_item';

  const weightMatch = u.match(/^(\d+(?:\.\d+)?)\s*(kg|g)$/);
  if (weightMatch) {
    const [, amount, unitPart] = weightMatch;
    weightGrams = unitPart === 'kg'
      ? Math.round(parseFloat(amount) * 1000)
      : parseInt(amount, 10);
    unitType = 'per_100g';
  } else if (u === 'kg') {
    unitType = 'per_kg';
  } else if (u === 'g') {
    unitType = 'per_100g';
  } else {
    const volumeMatch = u.match(/^(\d+(?:\.\d+)?)\s*(l|ml)$/);
    if (volumeMatch) {
      const [, amount, unitPart] = volumeMatch;
      volumeMl = unitPart === 'l'
        ? Math.round(parseFloat(amount) * 1000)
        : parseInt(amount, 10);
      unitType = 'per_100ml';
    } else if (u === 'l' || u === 'litre' || u === 'liter') {
      unitType = 'per_litre';
    } else if (u === 'ml') {
      unitType = 'per_100ml';
    }
  }

  return {
    rawName: item.name,
    rawPrice: item.price,
    quantity: item.quantity || 1,
    weightGrams,
    volumeMl,
    unitType,
    suggestedCategory: suggestCategory(item.name),
    uncertain: false,
  };
}

async function scanReceipt(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No receipt image provided' });
  }

  const { items: claudeItems, confidence, rawText } = await extractText(req.file.path);
  const mappedItems = claudeItems.map(mapClaudeItem);
  const normalisedItems = normaliseItems(mappedItems);

  res.json({
    receiptId: null,
    imagePath: req.file.path,
    rawText,
    confidence,
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
