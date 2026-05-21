CREATE TABLE product_merges (
  id                 SERIAL PRIMARY KEY,
  primary_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  merged_product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_merges_no_self CHECK (primary_product_id != merged_product_id),
  CONSTRAINT product_merges_unique  UNIQUE (primary_product_id, merged_product_id)
);

CREATE INDEX idx_product_merges_primary ON product_merges(primary_product_id);
CREATE INDEX idx_product_merges_merged  ON product_merges(merged_product_id);
