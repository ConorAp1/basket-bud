const pool = require('../config/db');

async function createMany(items) {
  if (!items.length) return [];
  const results = [];

  for (const item of items) {
    const { rows } = await pool.query(
      `INSERT INTO price_records
         (receipt_id, product_id, shop_id, raw_name, raw_price, quantity,
          weight_grams, unit_type, normalised_price_per_unit, scanned_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        item.receiptId,
        item.productId || null,
        item.shopId || null,
        item.rawName,
        item.rawPrice,
        item.quantity || 1,
        item.weightGrams || null,
        item.unitType || 'unknown',
        item.normalisedPrice || null,
        item.scannedAt || new Date(),
      ]
    );
    results.push(rows[0]);
  }

  return results;
}

async function findByReceiptId(receiptId) {
  const { rows } = await pool.query(
    `SELECT pr.*, p.name AS product_name, p.category
     FROM price_records pr
     LEFT JOIN products p ON p.id = pr.product_id
     WHERE pr.receipt_id = $1
     ORDER BY pr.id ASC`,
    [receiptId]
  );
  return rows;
}

async function findByProduct(productId) {
  const { rows } = await pool.query(
    `SELECT pr.*, s.name AS shop_name, r.scanned_at
     FROM price_records pr
     JOIN receipts r ON r.id = pr.receipt_id
     JOIN shops s ON s.id = pr.shop_id
     WHERE pr.product_id = $1
     ORDER BY r.scanned_at DESC`,
    [productId]
  );
  return rows;
}

async function findByProducts(productIds) {
  if (!productIds.length) return [];
  const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `SELECT pr.*, s.name AS shop_name, r.scanned_at
     FROM price_records pr
     JOIN receipts r ON r.id = pr.receipt_id
     JOIN shops s ON s.id = pr.shop_id
     WHERE pr.product_id IN (${placeholders})
     ORDER BY r.scanned_at DESC`,
    productIds
  );
  return rows;
}

module.exports = { createMany, findByReceiptId, findByProduct, findByProducts };
