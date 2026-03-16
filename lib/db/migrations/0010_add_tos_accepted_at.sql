-- Add tos_accepted_at column for Terms of Service acceptance tracking
-- Nullable: existing users will have NULL (they are NOT blocked)
-- Only set explicitly when user accepts ToS during signup

ALTER TABLE "users" ADD COLUMN "tos_accepted_at" timestamp with time zone;
