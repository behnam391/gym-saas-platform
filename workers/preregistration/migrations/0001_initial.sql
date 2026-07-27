CREATE TABLE IF NOT EXISTS preregistrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  role TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  gym_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  consent INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'landing',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (mobile, role)
);

CREATE INDEX IF NOT EXISTS preregistrations_created_at_idx
ON preregistrations (created_at DESC);

CREATE INDEX IF NOT EXISTS preregistrations_status_idx
ON preregistrations (status);

CREATE INDEX IF NOT EXISTS preregistrations_location_idx
ON preregistrations (province, city);

CREATE TABLE IF NOT EXISTS request_limits (
  bucket TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS request_limits_expires_at_idx
ON request_limits (expires_at);
