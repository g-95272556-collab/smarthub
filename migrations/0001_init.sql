CREATE TABLE IF NOT EXISTS sheet_rows (
  sheet_name TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  row_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sheet_name, row_index)
);

CREATE INDEX IF NOT EXISTS idx_sheet_rows_sheet_name_row_index
ON sheet_rows(sheet_name, row_index);
