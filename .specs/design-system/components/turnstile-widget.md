# TurnstileWidget

**Status**: ✅ Documented
**Created**: 2026-03-16

## Purpose

Cloudflare Turnstile anti-bot verification widget. Wraps the Turnstile JS SDK in a React component with managed mode support, automatic token refresh on expiry, and error state handling.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| siteKey | string | Yes | Cloudflare Turnstile site key |
| onSuccess | (token: string) => void | Yes | Called when verification succeeds |
| onError | () => void | No | Called when widget fails to load |
| onExpire | () => void | No | Called when token expires |
| theme | 'light' \| 'dark' | No | Widget theme (default: 'light') |
| size | 'invisible' \| 'compact' \| 'normal' | No | Widget size (default: managed) |

## Variants

- **Invisible**: No visible UI — challenge runs in background
- **Compact**: Small checkbox widget shown when Turnstile escalates
- **Error state**: Alert message when widget fails to load

## Usage

```tsx
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

<TurnstileWidget
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => setTurnstileError(true)}
/>
```

Requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY` env var. Returns `null` if not configured (dev mode).

## Design Tokens

- Error alert: `color-error`, `text-sm`, `radius-sm`
- Widget container: `color-surface`, `color-border`, `radius-sm`

## Related

- Feature spec: `.specs/features/security/anti-bot-protection.feature.md`
