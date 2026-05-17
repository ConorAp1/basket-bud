const pool = require('../config/db');
const logger = require('../utils/logger');

async function getSpendSummary({ startDate, endDate } = {}) {
  const params = [];
  let dateFilter = '';

  if (startDate) {
    params.push(startDate);
    dateFilter += ` AND r.scanned_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    dateFilter += ` AND r.scanned_at <= $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       COUNT(DISTINCT r.id) AS total_receipts,
       SUM(pr.raw_price * pr.quantity) AS total_spend,
       COUNT(DISTINCT pr.product_id) AS unique_products,
       COUNT(DISTINCT r.shop_id) AS shops_visited
     FROM receipts r
     JOIN price_records pr ON pr.receipt_id = r.id
     WHERE 1=1 ${dateFilter}`,
    params
  );

  return rows[0];
}

async function getSpendByShop({ startDate, endDate } = {}) {
  const params = [];
  let dateFilter = '';

  if (startDate) {
    params.push(startDate);
    dateFilter += ` AND r.scanned_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    dateFilter += ` AND r.scanned_at <= $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       s.id AS shop_id,
       s.name AS shop_name,
       COUNT(DISTINCT r.id) AS receipt_count,
       SUM(pr.raw_price * pr.quantity) AS total_spend
     FROM shops s
     JOIN receipts r ON r.shop_id = s.id
     JOIN price_records pr ON pr.receipt_id = r.id
     WHERE 1=1 ${dateFilter}
     GROUP BY s.id, s.name
     ORDER BY total_spend DESC`,
    params
  );

  return rows;
}

async function getSpendByCategory({ startDate, endDate } = {}) {
  const params = [];
  let dateFilter = '';

  if (startDate) {
    params.push(startDate);
    dateFilter += ` AND r.scanned_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    dateFilter += ` AND r.scanned_at <= $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       COALESCE(p.category, 'Uncategorised') AS category,
       COUNT(pr.id) AS item_count,
       SUM(pr.raw_price * pr.quantity) AS total_spend
     FROM price_records pr
     JOIN receipts r ON r.id = pr.receipt_id
     LEFT JOIN products p ON p.id = pr.product_id
     WHERE 1=1 ${dateFilter}
     GROUP BY COALESCE(p.category, 'Uncategorised')
     ORDER BY total_spend DESC`,
    params
  );

  return rows;
}

async function getCheapestShopByProduct(productId) {
  const { rows } = await pool.query(
    `SELECT
       s.id AS shop_id,
       s.name AS shop_name,
       MIN(pr.normalised_price_per_unit) AS best_price,
       pr.unit_type,
       MAX(r.scanned_at) AS last_seen
     FROM price_records pr
     JOIN receipts r ON r.id = pr.receipt_id
     JOIN shops s ON s.id = pr.shop_id
     WHERE pr.product_id = $1
       AND pr.normalised_price_per_unit IS NOT NULL
     GROUP BY s.id, s.name, pr.unit_type
     ORDER BY best_price ASC`,
    [productId]
  );

  return rows;
}

async function getPriceTrends(productId, { startDate, endDate } = {}) {
  const params = [productId];
  let dateFilter = '';

  if (startDate) {
    params.push(startDate);
    dateFilter += ` AND r.scanned_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    dateFilter += ` AND r.scanned_at <= $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       r.scanned_at,
       s.name AS shop_name,
       pr.normalised_price_per_unit AS price,
       pr.unit_type
     FROM price_records pr
     JOIN receipts r ON r.id = pr.receipt_id
     JOIN shops s ON s.id = pr.shop_id
     WHERE pr.product_id = $1 ${dateFilter}
     ORDER BY r.scanned_at ASC`,
    params
  );

  return rows;
}

module.exports = { getSpendSummary, getSpendByShop, getSpendByCategory, getCheapestShopByProduct, getPriceTrends };
