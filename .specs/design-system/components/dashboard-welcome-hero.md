# Component: DashboardWelcomeHero

**Status**: 📝 Stub (pending implementation)
**Source**: `components/dashboard/dashboard-welcome-hero.tsx`
**Spec**: `.specs/features/dashboard/welcome-hero.feature.md`

## Purpose

Top-of-dashboard hero section. Combines a personalized time-of-day greeting with the account stats row (or an onboarding CTA for first-time users). The first thing users see — sets the editorial tone.

## Props

_To be documented after implementation._

## Variants

- **With reports**: greeting + tagline + divider + stats row + CTA button
- **No reports**: greeting + onboarding prompt + full-width CTA (no stats)
- **No name**: falls back to "Welcome back." greeting

## Notes

- Greeting computed client-side (time-of-day depends on local clock)
- Absorbs or wraps the existing `DashboardStats` component
- User first name resolved from `user.user_metadata`
