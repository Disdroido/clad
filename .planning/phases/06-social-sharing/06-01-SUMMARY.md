---
phase: 06-social-sharing
plan: 01
subsystem: social-backend
tags: [api, database, social, sharing, engagement]
duration: 3.5min
completed_date: 2026-06-01T06:29:25Z
tech-stack:
  added: []
  patterns: [drizzle-orm, zod-validation, h3-event-handler, toggle-pattern, upsert-pattern]
key-files:
  created:
    - server/db/migrations/0004_panoramic_sasquatch.sql
    - server/api/share/index.post.ts
    - server/api/share/[id].get.ts
    - server/api/profile/public/index.patch.ts
    - server/api/profile/public/[username].get.ts
    - server/api/discover/index.get.ts
    - server/api/outfits/[id]/like.post.ts
    - server/api/profiles/[username]/follow.post.ts
    - server/api/outfits/[id]/save.post.ts
    - server/api/inspiration/index.get.ts
  modified:
    - server/db/schema.ts
    - server/utils/session.ts
decisions:
  - Shared outfit IDs use 8-char hex shortId (first 8 chars of UUID sans dashes) for cleaner share URLs
  - Public endpoints (share, discover, profile) use getOptionalUserId for optional viewer context without blocking anonymous access
  - Engagement endpoints (like, follow, save) toggle with single POST call (insert if not exists, delete if exists) for stateless API pattern
  - PATCH /api/profile/public upserts (creates if first time, updates if existing) to simplify client logic
  - Discover feed filters to isPublic=true profiles only — private profiles' outfits never appear in global feed
  - Self-follow prevention returns 400 (not silently ignored) so client can show appropriate message
depends_on: []
provides: [SOCIAL-01, SOCIAL-02]
affects: [06-02, 06-03]
---

# Phase 06 Plan 01: Social Sharing Backend Summary

**One-liner:** Complete social sharing backend with 5 Drizzle DB tables, optional auth utility, and 9 API endpoints for sharing, discovery, engagement, and inspiration.

## Overview

This plan built the entire Phase 06 backend data layer and API surface. It added 5 new PostgreSQL tables (shared_outfits, public_profiles, likes, follows, saves) via Drizzle ORM, extended the session utility with a `getOptionalUserId` function for public pages, and implemented 9 API endpoints covering: outfit sharing with short-link generation, public profile management, chronological discover feed, engagement toggles (like/follow/save), and a personal inspiration board.

## What Was Built

### Database Schema (Task 1)
- **shared_outfits:** Links users to their outfits with a unique 8-char `shortId` for share URLs. References `user.id` and `outfits.id` with cascade deletes.
- **public_profiles:** Per-user public-facing profile with unique `username`, `displayName`, `bio`, and `isPublic` toggle. Upserted via PATCH.
- **likes:** Tracks likes on shared outfits. Composite `(userId, outfitId)` provides uniqueness via application-level toggle logic.
- **follows:** Tracks follower→followed relationships between users (via public_profiles). Prevents self-follow with 400 error.
- **saves:** Tracks saved/bookmarked shared outfits per user for the inspiration board.

All tables use `uuid().defaultRandom().primaryKey()`, `text()` for user references (matching Better Auth), and `createdAt: timestamp().defaultNow().notNull()`.

### Auth Utility (Task 1)
- **`getOptionalUserId(event)`:** Returns `userId | null` — never throws 401. Used by public endpoints (`/share/[id]`, `/discover`, `/profile/public/[username]`) to attach viewer-specific context (whether anonymous user has liked/followed) without blocking unauthenticated access.

### API Endpoints (Tasks 2-3)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/share` | Required | Creates shared_outfit record with 8-char shortId; returns `{ shareUrl, shortId }` |
| `GET /api/share/[id]` | Public | Fetches shared outfit with items, sharer profile, like count, viewer-liked status |
| `PATCH /api/profile/public` | Required | Upserts public profile (username, displayName, bio, isPublic); checks username uniqueness |
| `GET /api/profile/public/[username]` | Public | Fetches public profile with shared outfit gallery, like counts, viewer-following status |
| `GET /api/discover` | Public | Chronological feed from public profiles only; supports `?limit=20&offset=0` pagination |
| `POST /api/outfits/[id]/like` | Required | Toggles like; returns `{ liked: boolean, likeCount: number }` |
| `POST /api/profiles/[username]/follow` | Required | Toggles follow; prevents self-follow with 400; returns `{ following: boolean }` |
| `POST /api/outfits/[id]/save` | Required | Toggles save/bookmark; returns `{ saved: boolean }` |
| `GET /api/inspiration` | Required | Returns authenticated user's saved outfits with sharer info, ordered by save date desc |

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

1. ✅ `npm run db:generate` runs clean — "No schema changes, nothing to migrate"
2. ✅ All 5 tables exist in schema (shared_outfits, public_profiles, likes, follows, saves)
3. ✅ `getOptionalUserId` exported from session.ts
4. ✅ All 9 API endpoints exist with `defineEventHandler` pattern
5. ✅ Protected endpoints use `requireUserId` (share POST, profile PATCH, like, follow, save, inspiration)
6. ✅ Public endpoints use `getOptionalUserId` (share GET, discover, profile GET)
7. ✅ POST/PATCH endpoints validate bodies with Zod
8. ✅ Self-follow prevention check present in follow endpoint
9. ✅ DB migration 0004 generated and applied to Neon

## Commits

| Commit | Message |
|--------|---------|
| `d7359b51` | feat(06-social-sharing): add social DB tables and getOptionalUserId utility |
| `016628e1` | feat(06-social-sharing): add share, public profile, and discover API endpoints |
| `b4054adb` | feat(06-social-sharing): add engagement toggle and inspiration API endpoints |

## Self-Check: PASSED

- [x] server/db/schema.ts — 5 new tables present
- [x] server/utils/session.ts — getOptionalUserId exported
- [x] server/db/migrations/0004_panoramic_sasquatch.sql — migration generated
- [x] server/api/share/index.post.ts — exists, requires auth
- [x] server/api/share/[id].get.ts — exists, public (getOptionalUserId)
- [x] server/api/profile/public/index.patch.ts — exists, requires auth
- [x] server/api/profile/public/[username].get.ts — exists, public
- [x] server/api/discover/index.get.ts — exists, public
- [x] server/api/outfits/[id]/like.post.ts — exists, requires auth
- [x] server/api/profiles/[username]/follow.post.ts — exists, requires auth
- [x] server/api/outfits/[id]/save.post.ts — exists, requires auth
- [x] server/api/inspiration/index.get.ts — exists, requires auth
- [x] Commits d7359b51, 016628e1, b4054adb verified in git log
