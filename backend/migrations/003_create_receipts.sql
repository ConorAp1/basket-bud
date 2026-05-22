CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shops(id),
  scanned_at TIMESTAMPTZ NOT NULL,
  image_path TEXT NOT NULL,
  raw_ocr_text TEXT,
  total_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_shop_id ON receipts(shop_id);
CREATE INDEX IF NOT EXISTS idx_receipts_scanned_at ON receipts(scanned_at);
