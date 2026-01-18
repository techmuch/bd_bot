DROP INDEX IF EXISTS idx_users_auth;
ALTER TABLE users 
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS auth_provider,
DROP COLUMN IF EXISTS password_hash;
