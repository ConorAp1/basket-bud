const { extractText } = require('../services/ocrService');
const { suggestCategory } = require('../services/parserService');
const { normaliseItems } = require('../services/normalisationService');
const ReceiptModel = require('../models/Receipt');
const PriceRecordModel = require('../models/PriceRecord');
const ShopModel = require('../models/Shop');
const logger = require('../utils/logger');

// Map Claude's response to the format normaliseItems expects.
// Claude sometimes returns different field names despite the prompt, so we
// fall back through common alternatives before defaulting.
function mapClaudeItem(item) {
  const rawName =
    item.name ?? item.item_name ?? item.product_name ?? item.description ?? item.item ?? '';
  const rawPrice =
    item.price ?? item.unit_price ?? item.total_price ?? item.amount ?? item.cost ?? 0;
  const quantity = item.quantity ?? item.qty ?? item.count ?? 1;
  const u = (item.unit ?? item.unit_type ?? item.measure ?? 'each').toLowerCase().trim();

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
    rawName,
    rawPrice,
    quantity,
    weightGrams,
    volumeMl,
    unitType,
    suggestedCategory: suggestCategory(rawName),
    uncertain: false,
  };
}

async function scanReceipt(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No receipt image provided' });
  }

  let claudeItems, detectedShop, confidence, rawText;
  try {
    ({ items: claudeItems, detectedShop, confidence, rawText } = await extractText(req.file.path));
  } catch (err) {
    logger.error('Receipt scan failed', { file: req.file.path, error: err.message });
    // The central errorHandler masks 5xx messages; respond here so the user
    // sees why the scan failed (truncated response, bad image, API auth, etc).
    return res.status(502).json({ error: `Receipt scanning failed: ${err.message}` });
  }
  const mappedItems = claudeItems.map(mapClaudeItem);
  const normalisedItems = normaliseItems(mappedItems);

  res.json({
    receiptId: null,
    imagePath: req.file.path,
    rawText,
    confidence,
    detectedShop,
    items: normalisedItems,
  });
}

async function confirmReceipt(req, res) {
  const { shopName, shopLocation, scannedAt, items } = req.body;

  const shop = shopName ? await ShopModel.findOrCreate({ name: shopName, location: shopLocation }) : null;

  const calculatedTotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.rawPrice) || 0) * (parseFloat(item.quantity) || 1),
    0
  );

  const receipt = await ReceiptModel.create({
    shopId: shop ? shop.id : null,
    scannedAt: scannedAt || new Date(),
    imagePath: req.body.imagePath || 'manual',
    rawOcrText: req.body.rawText || null,
    totalAmount: parseFloat(calculatedTotal.toFixed(2)),
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
