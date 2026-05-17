INSERT INTO shops (name, location) VALUES
  ('Tesco', NULL),
  ('Aldi', NULL),
  ('Lidl', NULL),
  ('Sainsbury''s', NULL),
  ('Asda', NULL),
  ('Morrisons', NULL),
  ('Waitrose', NULL),
  ('Co-op', NULL)
ON CONFLICT DO NOTHING;
