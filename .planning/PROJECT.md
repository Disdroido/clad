# Clad — AI Wardrobe Assistant

**Stack:** Nuxt 4 | TailwindCSS v4 | Drizzle ORM | Neon (PostgreSQL) | Cloudflare Workers + R2 | Better Auth | OpenRouter (Gemini Flash)

## Purpose
Clad is an AI-powered wardrobe management app. Users photograph their clothing, AI auto-tags each item (type, colour, pattern, season, formality), and the app generates outfit combinations based on the user's style preferences, occasion, and colour harmony rules.

## Architecture
- **Frontend:** Nuxt 4 with Vue 3, TailwindCSS v4, responsive design (mobile bottom nav + desktop sidebar)
- **Backend:** Nitro server on Cloudflare Workers (cloudflare-module preset)
- **Database:** PostgreSQL via Neon (Drizzle ORM with pg)
- **Storage:** Cloudflare R2 for clothing images
- **Auth:** Better Auth (email/password with Drizzle adapter)
- **AI:** OpenRouter API (Gemini 2.0 Flash Lite for vision + text)

## Deployment
- Cloudflare Workers (wrangler)
- Neon PostgreSQL
- R2 for image storage

## Design System
- Brand colors (`brand-50` through `brand-950`) via Tailwind v4
- Rounded corners, soft shadows, brand-100 backgrounds
- Clean, minimal aesthetic with emoji icons

## Current State
**Phase 02 (Outfit Lifecycle) complete** — Wear tracking infrastructure, rating, wear history UI, and wear-aware outfit generation all implemented.
**Phase 03 (Weather Integration)** — next up.

*Last updated: 2026-06-01*
