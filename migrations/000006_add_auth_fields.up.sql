ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create index for external lookups
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_provider, external_id);
