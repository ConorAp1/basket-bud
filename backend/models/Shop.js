const pool = require('../config/db');

async function findAll() {
  const { rows } = await pool.query('SELECT * FROM shops ORDER BY name ASC');
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ name, location }) {
  const { rows } = await pool.query(
    'INSERT INTO shops (name, location) VALUES ($1, $2) RETURNING *',
    [name, location || null]
  );
  return rows[0];
}

async function findOrCreate({ name, location }) {
  const { rows } = await pool.query('SELECT * FROM shops WHERE LOWER(name) = LOWER($1)', [name]);
  if (rows[0]) return rows[0];
  return create({ name, location });
}

module.exports = { findAll, findById, create, findOrCreate };
