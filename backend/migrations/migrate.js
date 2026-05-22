require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
const isRemoteRailway = dbUrl && (dbUrl.includes('railway.app') || dbUrl.includes('rlwy.net'));

const poolConfig = dbUrl
  ? {
      connectionString: dbUrl,
      ssl: isRemoteRailway ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'basketbud_db',
      user: process.env.DB_USER || 'basketbud',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool(poolConfig);

async function migrate() {
  const migrationDir = __dirname;
  const files = fs
    .readdirSync(migrationDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    console.log(`  → ${file}`);
    try {
      await pool.query(sql);
    } catch (err) {
      console.error(`  ✗ ${file} failed: ${err.message}`);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
