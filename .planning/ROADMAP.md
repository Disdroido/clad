# Clad — Roadmap

## Phase 01: Core App
**Status:** ✅ Complete
**Goal:** Wardrobe upload with AI analysis, outfit generation, auth, settings, and onboarding.

**Features built:**
- Better Auth (email/password signup, login, sessions)
- Wardrobe management (upload, AI auto-tagging, edit, item detail)
- Outfit generation (rule engine + AI reasoning, occasion-based)
- Settings (profile, archive management, export, sign out)
- Onboarding (style preferences, body type, climate, goals)
- Archive system (items & outfits)
- Responsive layout (mobile bottom nav, desktop sidebar)
- Image compression, R2 storage

**Requirements:**
- [AUTH-01] User can sign up and log in with email/password
- [AUTH-02] User can sign out and manage session
- [WARDROBE-01] User can upload clothing photos and AI auto-tags them
- [WARDROBE-02] User can view, edit, and archive wardrobe items
- [OUTFIT-01] User can generate outfit suggestions based on occasion
- [OUTFIT-02] User can save, view, and archive generated outfits
- [PROFILE-01] User can set style preferences via onboarding
- [SETTINGS-01] User can view settings and export data
- [ARCHIVE-01] User can view and manage archived items and outfits

---

## Phase 02: Outfit Lifecycle & Wear History
**Status:** ✅ Complete (3/3 plans complete)
**Goal:** Track what users actually wear, add ratings, and make outfit generation smarter by learning from wear patterns.

**Plans:**
- [x] 02-01-PLAN.md — Wear tracking schema and API (3 tasks, Wave 1)
- [x] 02-02-PLAN.md — Wear tracking UI and outfit rating (3 tasks, Wave 1, parallel)
- [x] 02-03-PLAN.md — Smart generation with wear recency (2 tasks, Wave 2)

**Requirements:**
- [x] [WEAR-01] User can log when they wear a saved outfit
- [x] [WEAR-02] User can rate outfits after wearing them
- [x] [WEAR-03] User can view wear history (what I wore, when)
- [x] [WEAR-04] Outfit generation avoids recently worn items
- [x] [WEAR-05] User can see wear count and last-worn date on items/outfits

---

## Phase 03: Weather Integration
**Status:** 🔮 Proposed
**Goal:** Enhance outfit suggestions with real-time weather data, temperature-aware filtering.

**Plans:**
- [ ] 03-01-PLAN.md — Weather API integration and data model
- [ ] 03-02-PLAN.md — Weather-aware outfit suggestions
- [ ] 03-03-PLAN.md — Weather display in UI

**Requirements:**
- [WEATHER-01] App fetches current/local weather when generating outfits
- [WEATHER-02] Outfit suggestions filter by temperature range
- [WEATHER-03] User can see current weather conditions in app
- [WEATHER-04] Weather data influences clothing type selection

---

## Phase 04: Wardrobe Analytics & Insights
**Status:** 🔮 Proposed
**Goal:** Provide users with data-driven insights about their wardrobe composition, style patterns, and gaps.

**Plans:**
- [ ] 04-01-PLAN.md — Analytics dashboard with charts
- [ ] 04-02-PLAN.md — Color palette analysis and style insights
- [ ] 04-03-PLAN.md — Wardrobe gap analysis + shopping suggestions

**Requirements:**
- [ANALYTICS-01] User can see wardrobe composition (categories, colours, seasons)
- [ANALYTICS-02] User can see most-worn items and outfits
- [ANALYTICS-03] AI identifies wardrobe gaps and suggests missing items

---

## Phase 05: Outfit Planning Calendar
**Status:** 🔮 Proposed
**Goal:** Let users plan outfits in advance on a calendar, schedule looks for events and trips.

**Plans:**
- [ ] 05-01-PLAN.md — Outfit scheduling schema and API
- [ ] 05-02-PLAN.md — Calendar view UI
- [ ] 05-03-PLAN.md — Trip packing list generator

**Requirements:**
- [CALENDAR-01] User can schedule outfits for specific dates
- [CALENDAR-02] User can view a calendar of planned outfits
- [CALENDAR-03] User can generate a packing list for trips

---

## Phase 06: Social & Sharing
**Status:** 🔮 Proposed
**Goal:** Let users share outfits, build a community, and get inspiration from others.

**Plans:**
- [ ] 06-01-PLAN.md — Outfit sharing (public links, social media)
- [ ] 06-02-PLAN.md — Public profile (opt-in) and OOTD feed
- [ ] 06-03-PLAN.md — Like, comment, follow features

**Requirements:**
- [SOCIAL-01] User can share outfits via public link
- [SOCIAL-02] User can opt into a public profile
- [SOCIAL-03] User can discover outfits from others (opt-in)

---

## Phase 07: Smart Wardrobe Enhancements
**Status:** 🔮 Proposed
**Goal:** Add advanced wardrobe management features like shopping lists, laundry tracking, and item lifecycle.

**Plans:**
- [ ] 07-01-PLAN.md — Shopping/wishlist feature
- [ ] 07-02-PLAN.md — Laundry and wear tracking for items
- [ ] 07-03-PLAN.md — Item condition and lifecycle management

**Requirements:**
- [SMART-01] User can add items to a shopping wishlist
- [SMART-02] User can track laundry/cleaning cycles
- [SMART-03] User can mark item condition (new, good, worn, needs repair)

---

## Phase 08: Multi-language & i18n
**Status:** 🔮 Proposed
**Goal:** Internationalize the app for global users.

**Plans:**
- [ ] 08-01-PLAN.md — i18n setup and content extraction
- [ ] 08-02-PLAN.md — Language selector and translations

**Requirements:**
- [I18N-01] App supports at least 2 languages
- [I18N-02] Language can be selected and persists across sessions
