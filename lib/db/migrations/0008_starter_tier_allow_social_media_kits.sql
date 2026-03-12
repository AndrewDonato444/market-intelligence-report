-- Allow Starter tier to generate 1 social media kit per month
UPDATE subscription_tiers
SET entitlements = jsonb_set(entitlements, '{social_media_kits}', '1')
WHERE slug = 'starter'
  AND (entitlements->>'social_media_kits')::int = 0;
