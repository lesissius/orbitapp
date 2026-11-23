-- İğne Ustası hesap veritabanı (Cloudflare D1)
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE COLLATE NOCASE,   -- misafirde boş
  pass_hash   TEXT,                         -- PBKDF2-SHA256, base64
  pass_salt   TEXT,
  is_guest    INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,             -- oturum anahtarının SHA-256 özeti (anahtarın kendisi saklanmaz)
  user_id     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS progress (
  user_id     TEXT PRIMARY KEY,
  data        TEXT NOT NULL,                -- oyun ilerlemesi (JSON)
  version     INTEGER NOT NULL DEFAULT 0,   -- her kayıtta artar; iki cihaz çakışmasını yakalar
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key          TEXT PRIMARY KEY,            -- ip + kullanıcı adı
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
