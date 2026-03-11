-- Migration: Add user account status columns
-- Feature: User Status Schema (#110)
--
-- Adds account lifecycle management: status enum, suspension/deletion timestamps, last login tracking.
-- Non-breaking: all new columns have defaults or are nullable.

-- Step 1: Create the enum type
CREATE TYPE user_account_status AS ENUM ('active', 'suspended', 'deleted');

-- Step 2: Add columns to users table
ALTER TABLE users ADD COLUMN status user_account_status NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;

-- Step 3: Backfill existing users (DEFAULT handles this, but explicit for safety)
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Step 4: Add index on status for admin queries
CREATE INDEX users_status_idx ON users (status);
