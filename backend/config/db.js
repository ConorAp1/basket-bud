const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const isRemoteRailway = dbUrl && dbUrl.includes('railway');

console.log('[db] DATABASE_URL present:', !!dbUrl);
console.log('[db] Connection target:', dbUrl ? dbUrl.split('@')[1] : 'localhost (fallback)');

const pool = new Pool(
  dbUrl
    ? {
        connectionString: dbUrl,
        ssl: isRemoteRailway ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'basketbud_db',
        user: process.env.DB_USER || 'basketbud',
        password: process.env.DB_PASSWORD || '',
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
  process.exit(-1);
});

module.exports = pool;
