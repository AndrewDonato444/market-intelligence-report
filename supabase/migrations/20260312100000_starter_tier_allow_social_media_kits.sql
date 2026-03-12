-- Allow Starter tier to generate 1 social media kit per month
-- Previously was 0, which blocked all Starter users from using the feature.

UPDATE subscription_tiers
SET entitlements = jsonb_set(entitlements, '{social_media_kits}', '1')
WHERE slug = 'starter'
  AND (entitlements->>'social_media_kits')::int = 0;
