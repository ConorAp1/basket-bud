const pool = require('../config/db');

async function findAll({ shopId, limit = 20, offset = 0 } = {}) {
  const params = [];
  let where = 'WHERE 1=1';

  if (shopId) {
    params.push(shopId);
    where += ` AND r.shop_id = $${params.length}`;
  }

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT r.*, s.name AS shop_name
     FROM receipts r
     LEFT JOIN shops s ON s.id = r.shop_id
     ${where}
     ORDER BY r.scanned_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT r.*, s.name AS shop_name
     FROM receipts r
     LEFT JOIN shops s ON s.id = r.shop_id
     WHERE r.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ shopId, scannedAt, imagePath, rawOcrText, totalAmount }) {
  const { rows } = await pool.query(
    `INSERT INTO receipts (shop_id, scanned_at, image_path, raw_ocr_text, total_amount)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [shopId || null, scannedAt || new Date(), imagePath, rawOcrText || null, totalAmount || null]
  );
  return rows[0];
}

module.exports = { findAll, findById, create };
