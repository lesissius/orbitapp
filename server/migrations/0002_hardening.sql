-- Güvenlik sertleştirmesi
-- 1) Kullanıcı adının sadeleştirilmiş biçimi (büyük/küçük harf ve Türkçe harf farkı yok): "Admın" ile "admin" aynı sayılır
ALTER TABLE users ADD COLUMN username_key TEXT;
UPDATE users SET username_key = lower(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_key ON users(username_key);
-- 2) Uzun süre girmeyen misafirleri temizlemek için
CREATE INDEX IF NOT EXISTS idx_users_guest_updated ON users(is_guest, updated_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
-- 3) Genel istek sınırı (IP adresi açık tutulmaz, tuzlanmış özeti saklanır)
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
-- Eski tablo IP adresini açık saklıyordu; kaldırıldı
DROP TABLE IF EXISTS login_attempts;
