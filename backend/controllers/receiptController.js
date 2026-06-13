const { extractText } = require('../services/ocrService');
const { suggestCategory } = require('../services/parserService');
const { normaliseItems, normalisePrice } = require('../services/normalisationService');
const { matchLineItems, ensureProduct } = require('../services/matchingService');
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

  let weightGrams = null;
  let volumeMl = null;
  let unitType = 'per_item';

  // Preferred path: structured size from the new OCR prompt.
  const sizeValue = Number(item.size_value);
  const sizeUnit = (item.size_unit || '').toLowerCase().trim();
  if (sizeValue > 0 && sizeUnit) {
    if (sizeUnit === 'kg') {
      weightGrams = Math.round(sizeValue * 1000);
      unitType = 'per_100g';
    } else if (sizeUnit === 'g') {
      weightGrams = Math.round(sizeValue);
      unitType = 'per_100g';
    } else if (sizeUnit === 'l' || sizeUnit === 'litre' || sizeUnit === 'liter') {
      volumeMl = Math.round(sizeValue * 1000);
      unitType = 'per_100ml';
    } else if (sizeUnit === 'ml') {
      volumeMl = Math.round(sizeValue);
      unitType = 'per_100ml';
    }
  } else {
    // Legacy path: size embedded in the unit string (e.g. "2kg", "500ml").
    const u = (item.unit ?? item.unit_type ?? item.measure ?? 'each').toLowerCase().trim();
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

  const { items: claudeItems, shopName, receiptDate, totalAmount, confidence, rawText } =
    await extractText(req.file.path);
  const mappedItems = claudeItems.map(mapClaudeItem);
  const normalisedItems = normaliseItems(mappedItems);
  const matchedItems = await matchLineItems(normalisedItems);

  res.json({
    receiptId: null,
    imagePath: req.file.path,
    rawText,
    confidence,
    shopName,
    receiptDate,
    totalAmount,
    items: matchedItems,
  });
}

async function confirmReceipt(req, res) {
  const { shopName, shopLocation, scannedAt, items, totalAmount } = req.body;

  const shop = shopName && shopName !== 'Unknown'
    ? await ShopModel.findOrCreate({ name: shopName, location: shopLocation })
    : null;

  const receipt = await ReceiptModel.create({
    shopId: shop ? shop.id : null,
    scannedAt: scannedAt || new Date(),
    imagePath: req.body.imagePath || 'manual',
    rawOcrText: req.body.rawText || null,
    totalAmount: totalAmount || null,
  });

  // Link every line item to a canonical product (creating one when new) and
  // recompute normalisation server-side, since the user may have edited
  // prices, quantities or sizes during review.
  const priceRecords = [];
  for (const item of items) {
    const productId = await ensureProduct(item);
    const { normalisedPrice, unitType } = normalisePrice({
      rawPrice: item.rawPrice,
      quantity: item.quantity || 1,
      weightGrams: item.weightGrams,
      volumeMl: item.volumeMl,
      unitType: item.unitType,
    });

    priceRecords.push({
      receiptId: receipt.id,
      productId,
      shopId: shop ? shop.id : null,
      rawName: item.rawName,
      rawPrice: item.rawPrice,
      quantity: item.quantity || 1,
      weightGrams: item.weightGrams || null,
      volumeMl: item.volumeMl || null,
      unitType,
      normalisedPrice,
      scannedAt: scannedAt || new Date(),
    });
  }

  const savedRecords = await PriceRecordModel.createMany(priceRecords);

  logger.info('Receipt confirmed and saved', {
    receiptId: receipt.id,
    itemCount: savedRecords.length,
    linkedProducts: savedRecords.filter((r) => r.product_id).length,
  });

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
