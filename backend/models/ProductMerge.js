const pool = require('../config/db');

async function create(primaryProductId, mergedProductId) {
  const { rows } = await pool.query(
    `INSERT INTO product_merges (primary_product_id, merged_product_id)
     VALUES ($1, $2) RETURNING *`,
    [primaryProductId, mergedProductId]
  );
  return rows[0];
}

async function findByProduct(productId) {
  const { rows } = await pool.query(
    `SELECT pm.id, pm.primary_product_id, pm.merged_product_id, pm.created_at,
       CASE WHEN pm.primary_product_id = $1 THEN 'primary' ELSE 'merged' END AS role,
       p.id   AS other_product_id,
       p.name AS other_product_name
     FROM product_merges pm
     JOIN products p ON p.id = CASE
       WHEN pm.primary_product_id = $1 THEN pm.merged_product_id
       ELSE pm.primary_product_id
     END
     WHERE pm.primary_product_id = $1 OR pm.merged_product_id = $1
     ORDER BY pm.created_at DESC`,
    [productId]
  );
  return rows;
}

async function getRelatedProductIds(productId) {
  const { rows } = await pool.query(
    `SELECT CASE
       WHEN primary_product_id = $1 THEN merged_product_id
       ELSE primary_product_id
     END AS related_id
     FROM product_merges
     WHERE primary_product_id = $1 OR merged_product_id = $1`,
    [productId]
  );
  return rows.map((r) => r.related_id);
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM product_merges WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { create, findByProduct, getRelatedProductIds, remove };
