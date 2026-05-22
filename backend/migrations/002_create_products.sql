CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  canonical_unit VARCHAR(20) CHECK (canonical_unit IN ('per_item', 'per_100g', 'per_kg', 'per_litre', 'per_100ml', 'unknown')) DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
