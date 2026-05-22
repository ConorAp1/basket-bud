CREATE TABLE IF NOT EXISTS price_records (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  shop_id INTEGER REFERENCES shops(id),
  raw_name VARCHAR(200) NOT NULL,
  raw_price NUMERIC(10, 2) NOT NULL,
  quantity NUMERIC(10, 3) DEFAULT 1,
  weight_grams INTEGER,
  unit_type VARCHAR(20) CHECK (unit_type IN ('per_item', 'per_100g', 'per_kg', 'per_litre', 'per_100ml', 'unknown')) DEFAULT 'unknown',
  normalised_price_per_unit NUMERIC(10, 4),
  scanned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_records_product_id ON price_records(product_id);
CREATE INDEX IF NOT EXISTS idx_price_records_shop_id ON price_records(shop_id);
CREATE INDEX IF NOT EXISTS idx_price_records_scanned_at ON price_records(scanned_at);
CREATE INDEX IF NOT EXISTS idx_price_records_receipt_id ON price_records(receipt_id);
