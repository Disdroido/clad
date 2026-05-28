# 🧺 Clad — AI Wardrobe Assistant

Snap photos of your clothes → AI labels and organizes them → Get personalized outfit suggestions.

Built with **Nuxt 4**, **Neon Postgres**, and **OpenRouter** (Gemini Flash).

## Features

- 📸 **AI Clothing Recognition** — Snap a photo, get structured labels (type, colour, pattern, material, formality, season)
- 👗 **Two-Stage Outfit Generation** — Deterministic pre-filter + AI selection
- 🧠 **User Profile** — Multi-step onboarding (style vibes, colours, body type, lifestyle)
- 📱 **Mobile-First** — PWA-ready, camera capture on mobile
- 🎨 **Colour Harmony Engine** — Uses colour wheel theory for compatible combinations

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (Vue 3 + Nitro) |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM |
| AI Vision | Gemini Flash via OpenRouter |
| AI Text | Free OpenRouter model |
| Styling | Tailwind CSS v4 |
| Auth | Better Auth |
| Storage | Cloudflare R2 (planned) |

## Project Structure

```
clad/
├── app/                    # Nuxt 4 app directory
│   ├── pages/              # Routes (/, /onboarding, /wardrobe, /outfits)
│   ├── components/         # Vue components
│   ├── layouts/            # Page layouts
│   └── middleware/         # Route guards
├── server/
│   ├── api/                # Nitro API routes
│   ├── db/                 # Drizzle schema + connection
│   └── utils/              # OpenRouter client, outfit engine
├── lib/                    # Shared utilities
└── drizzle.config.ts       # Drizzle configuration
```

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Fill in: NEON_DATABASE_URL, OPENROUTER_API_KEY, AUTH_SECRET, R2_* keys

# Generate database types
npx nuxt prepare

# Run dev server
npm run dev
```

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/wardrobe/upload` | Upload & save clothing item |
| GET | `/api/wardrobe/items` | List user's wardrobe items |
| POST | `/api/wardrobe/analyze` | AI analyze clothing image |
| POST | `/api/outfits/generate` | Generate outfit for occasion |
| GET | `/api/outfits` | List user's outfit history |

## Outfit Generation (Two-Stage)

### Stage 1: Deterministic Pre-Filter
Filters by season, formality, colour harmony (colour wheel), and pattern compatibility rules. Produces top 20-40 valid combinations.

### Stage 2: AI Selection
Sends the shortlist to the AI model with user profile context, gets back the best pick + explanation.

## Roadmap

- [ ] Better Auth integration (email magic link + Google)
- [ ] Cloudflare R2 image storage
- [ ] Batch photo upload
- [ ] Outfit history + rating
- [ ] Weekly planner (outfit calendar)
- [ ] Import from online stores
- [ ] Social sharing

## License

MIT
