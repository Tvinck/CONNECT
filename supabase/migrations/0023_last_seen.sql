-- Add last_seen column to users
ALTER TABLE users ADD COLUMN last_seen timestamp with time zone;

-- Also let's ensure status is 'offline' by default
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'offline';
