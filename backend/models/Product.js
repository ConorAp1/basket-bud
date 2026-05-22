const pool = require('../config/db');

async function findAll({ category, search, limit = 50, offset = 0 } = {}) {
  const params = [];
  let where = 'WHERE 1=1';

  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    where += ` AND name ILIKE $${params.length}`;
  }

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT * FROM products ${where} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ name, brand, category, tags, canonical_unit }) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, brand, category, tags, canonical_unit)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, brand || null, category || null, tags || [], canonical_unit || 'unknown']
  );
  return rows[0];
}

async function update(id, { name, brand, category, tags, canonical_unit }) {
  const { rows } = await pool.query(
    `UPDATE products SET
       name = COALESCE($1, name),
       brand = COALESCE($2, brand),
       category = COALESCE($3, category),
       tags = COALESCE($4, tags),
       canonical_unit = COALESCE($5, canonical_unit)
     WHERE id = $6 RETURNING *`,
    [name, brand, category, tags, canonical_unit, id]
  );
  return rows[0] || null;
}

async function getCategories() {
  const { rows } = await pool.query(
    `SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC`
  );
  return rows.map((r) => r.category);
}

async function fuzzySearch(name) {
  const { rows } = await pool.query(
    `SELECT *, similarity(name, $1) AS sim
     FROM products
     WHERE name % $1 OR name ILIKE $2
     ORDER BY sim DESC
     LIMIT 5`,
    [name, `%${name}%`]
  );
  return rows;
}

module.exports = { findAll, findById, create, update, getCategories, fuzzySearch };
