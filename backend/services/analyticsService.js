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

async function getTopProductsBySpend({ startDate, endDate, limit = 10 } = {}) {
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

  params.push(limit);

  const { rows } = await pool.query(
    `SELECT
       COALESCE(p.name, pr.raw_name) AS product_name,
       p.id                          AS product_id,
       SUM(pr.raw_price * pr.quantity) AS total_spend,
       COUNT(*)                      AS purchase_count
     FROM price_records pr
     LEFT JOIN products p ON p.id = pr.product_id
     JOIN receipts r ON r.id = pr.receipt_id
     WHERE 1=1 ${dateFilter}
     GROUP BY COALESCE(p.name, pr.raw_name), p.id
     ORDER BY total_spend DESC
     LIMIT $${params.length}`,
    params
  );

  return rows;
}

async function getShopComparisonScore({ startDate, endDate } = {}) {
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
    `WITH ranked_prices AS (
       SELECT
         pr.product_id,
         r.shop_id,
         MIN(pr.normalised_price_per_unit) AS min_price
       FROM price_records pr
       JOIN receipts r ON r.id = pr.receipt_id
       WHERE pr.product_id IS NOT NULL
         AND pr.normalised_price_per_unit IS NOT NULL
         ${dateFilter}
       GROUP BY pr.product_id, r.shop_id
     ),
     multi_shop AS (
       SELECT product_id
       FROM ranked_prices
       GROUP BY product_id
       HAVING COUNT(DISTINCT shop_id) > 1
     ),
     cheapest AS (
       SELECT DISTINCT ON (rp.product_id) rp.product_id, rp.shop_id
       FROM ranked_prices rp
       WHERE rp.product_id IN (SELECT product_id FROM multi_shop)
       ORDER BY rp.product_id, rp.min_price ASC
     )
     SELECT
       s.name AS shop_name,
       COUNT(*)::int AS wins,
       (SELECT COUNT(*) FROM multi_shop)::int AS total_products
     FROM cheapest c
     JOIN shops s ON s.id = c.shop_id
     GROUP BY s.name
     ORDER BY wins DESC`,
    params
  );

  return rows;
}

async function getPriceTrendAlerts() {
  const { rows } = await pool.query(
    `WITH recent_prices AS (
       SELECT
         pr.product_id,
         p.name AS product_name,
         pr.normalised_price_per_unit AS price,
         pr.unit_type,
         r.scanned_at,
         ROW_NUMBER() OVER (PARTITION BY pr.product_id ORDER BY r.scanned_at DESC) AS rn
       FROM price_records pr
       JOIN receipts r ON r.id = pr.receipt_id
       JOIN products p ON p.id = pr.product_id
       WHERE pr.normalised_price_per_unit IS NOT NULL
         AND pr.product_id IS NOT NULL
     ),
     latest AS (
       SELECT product_id, product_name, price AS latest_price, unit_type
       FROM recent_prices WHERE rn = 1
     ),
     rolling_avg AS (
       SELECT product_id, AVG(price) AS avg_price
       FROM recent_prices
       WHERE rn BETWEEN 2 AND 4
       GROUP BY product_id
       HAVING COUNT(*) >= 2
     )
     SELECT
       l.product_id,
       l.product_name,
       ROUND(l.latest_price::numeric, 4)  AS latest_price,
       ROUND(ra.avg_price::numeric, 4)    AS avg_price,
       l.unit_type,
       ROUND(((l.latest_price - ra.avg_price) / ra.avg_price * 100)::numeric, 1) AS pct_change
     FROM latest l
     JOIN rolling_avg ra ON ra.product_id = l.product_id
     WHERE l.latest_price > ra.avg_price
     ORDER BY pct_change DESC
     LIMIT 10`
  );

  return rows;
}

module.exports = {
  getSpendSummary,
  getSpendByShop,
  getSpendByCategory,
  getCheapestShopByProduct,
  getPriceTrends,
  getTopProductsBySpend,
  getShopComparisonScore,
  getPriceTrendAlerts,
};
