# Mood Music - Project Guide

## What Is This

A mood-based music recommendation web app. Users type how they feel in natural language (English, Hinglish, or any romanized Indian language), pick a language preference, and get song recommendations powered by AI + Spotify.

**Live:** https://mood-music-ebon.vercel.app
**Backend:** https://mood-music-production.up.railway.app
**Repo:** github.com/Ani24may/mood-music

---

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Single-page app, no router, deployed on Vercel |
| Backend | Python FastAPI | Single service, deployed on Railway (Docker) |
| AI | Google Gemini (Flash Lite) | OpenAI as fallback |
| Music Data | Spotify Web API | Client Credentials flow, no user login |
| Database | Supabase (Postgres) | Mood search history, trending, stats |
| Styling | Vanilla CSS | Aurora gradient theme (teal/purple/pink) |

---

## Project Structure

```
mood-music/
├── backend/
│   ├── main.py              # FastAPI app, all endpoints, security middleware
│   ├── config.py            # Env vars loader (.env)
│   ├── ai_service.py        # Gemini/OpenAI: mood parsing, direct reco, song story
│   ├── spotify_service.py   # Spotify auth, search, track parsing, fallback songs
│   ├── supabase_client.py   # Supabase: record moods, trending, history, stats
│   ├── mood_mappings.py     # Fallback mood→tags + Hinglish keyword map
│   ├── cache.py             # 3-layer LRU in-memory cache
│   ├── rate_limiter.py      # Per-IP + global sliding window rate limiter
│   ├── usage_tracker.py     # Daily free search quota (10/day per IP)
│   ├── stats_tracker.py     # In-memory stats (fallback when no Supabase)
│   ├── validators.py        # Input sanitization & validation
│   ├── requirements.txt     # fastapi, uvicorn, httpx, python-dotenv
│   ├── .env.example         # Template for API keys
│   ├── Procfile             # Railway start command
│   └── Dockerfile           # Container build for Railway
│
├── frontend/
│   ├── vite.config.js       # Dev server + proxy /api → localhost:3001
│   ├── index.html           # HTML entry
│   ├── package.json         # react, react-dom, vite
│   └── src/
│       ├── main.jsx         # React DOM entry
│       ├── App.jsx          # Root component, state, taglines, quota wall
│       ├── App.css          # All styles (aurora theme, responsive)
│       ├── api.js           # API client (generatePlaylist, getUsage, getTrending, getMoodHistory)
│       ├── components/
│       │   ├── MoodInput.jsx          # Search + voice + emoji picks + counter
│       │   ├── SongResult.jsx         # Result card (mobile bottom sheet)
│       │   ├── AudioPreview.jsx       # Spotify embed player
│       │   ├── BackgroundAnimation.jsx # Mood-reactive aurora particles
│       │   ├── TrendingMoods.jsx      # Trending moods horizontal scroll
│       │   ├── MoodHeatmap.jsx        # GitHub-style mood calendar
│       │   └── ErrorDisplay.jsx       # Error states
│       └── utils/
│           └── shareCard.js           # Canvas PNG generator + watermark + Web Share API
│
├── railway.toml             # Railway deployment config (Dockerfile builder)
├── Dockerfile               # Backend container
├── CLAUDE.md                # This file
├── README.md                # Public-facing project docs
└── mood-dna.md              # Mood DNA feature spec (brainstormed, not built)
```

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | Vercel | Root: `frontend`, Framework: Vite, Env: `VITE_API_URL` |
| Backend | Railway | Dockerfile builder, Port: 3001 |
| Database | Supabase | Free tier, one table: `mood_searches` |

### Railway env vars
```
APP_ENV=production
SSL_VERIFY=true
ALLOWED_ORIGIN=https://mood-music-ebon.vercel.app
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-2.5-flash-lite
SUPABASE_URL=xxx
SUPABASE_KEY=xxx (publishable key)
RATE_LIMIT_PER_IP=5
RATE_LIMIT_GLOBAL=100
DAILY_FREE_LIMIT=10
AI_TIMEOUT_MS=10000
SPOTIFY_TIMEOUT_MS=15000
PORT=3001
```

### Vercel env vars
```
VITE_API_URL=https://mood-music-production.up.railway.app
```

---

## Running Locally

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
# Copy .env.example to .env, fill in API keys
python -m uvicorn main:app --host 127.0.0.1 --port 3001 --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Returns `{"status": "ok"}` |
| `/usage` | GET | Remaining daily searches for this IP |
| `/generate-playlist` | POST | Main search — mood + language → songs |
| `/trending` | GET | Top trending moods from Supabase |
| `/mood-history` | GET | Mood history for this IP (hashed) |
| `/stats` | GET | Daily search counts + unique visitors from Supabase |

### `POST /generate-playlist`

**Request:** `{ "mood": "missing home", "language": "Hindi" }`

**Response:** songs array + mood_tags + story + message + remaining + limit

**Error codes:** `400` (bad input), `402` (daily quota exhausted), `429` (rate limited), `413` (body too large)

---

## Architecture Flow

```
User Input → Rate Limiter → Validator → Daily Quota Check
    → Cache Check (HIT → skip AI)
    → AI Direct Recommendations → Spotify Search (2 failures → stop)
    → Fallback: AI Parse → Keyword Search → Fallback Songs
    → AI Song Story (non-blocking)
    → Record to Supabase
    → Response with songs + remaining count
```

### Failure Handling
- Gemini 429 → fallback mood mappings (user still gets songs)
- Spotify 429 (2 consecutive) → stop, use fallback curated songs
- Spotify hard block (>60s Retry-After) → immediate stop
- Everything down → fallback mappings + fallback songs (app never breaks)
- Fallback notice shown inside result popup, cleared on close

---

## Implemented Features

### Core
- Mood text → AI parsing → Spotify search → song results
- Direct AI song recommendations (10 songs verified on Spotify)
- AI-generated poetic song story
- Language selection: Tamil, Hindi, English, Telugu, Any
- Hinglish/romanized input (AI + Hinglish keyword fallback)

### UI
- Aurora gradient theme (teal/purple/pink — distinct from Tunelet)
- Mood-reactive background particles (color + speed by mood)
- 10 rotating taglines on page reload
- Emoji mood quick-picks
- Voice search (Web Speech API, language-aware)
- Mobile bottom sheet result card with sticky header
- Collapsible "more songs" list
- Responsive (5 breakpoints: 1024/768/600/420/350px)
- Waveform loading animation

### Features
- Share card (1080x1350 PNG with watermark + Spotify link)
- Audio preview (Spotify embed iframe)
- Daily search limit (10 free/day per IP)
- Search counter ("7 searches left today", turns pink at 3)
- Quota wall when limit reached
- Trending moods (Supabase, horizontal scroll with fire emoji)
- Mood heatmap (GitHub-style calendar from Supabase)
- Fallback songs per language when Spotify is down
- Graceful error messages (never shows 503 to users)

### Infrastructure
- Supabase (mood recording, trending, history, persistent stats)
- 3-layer in-memory cache
- Per-IP + global rate limiting
- Daily usage tracking
- Dockerfile + railway.toml for deployment
- httpx logging suppressed (prevents API key leaks)

---

## Security

- API keys in env vars, `.env` in `.gitignore`
- Security headers (X-Frame-Options, nosniff, HSTS, Referrer-Policy, Permissions-Policy)
- Request body size limit (2KB)
- Input validation (HTML strip, control chars, 500 char limit)
- Rate limiting (5 req/min per IP, 100 global)
- Daily quota (10/day per IP)
- X-Forwarded-For support with validation
- AI prompt injection protection
- AI output schema validation
- No secrets in logs (httpx suppressed, errors log type only)
- No secrets in error responses
- CORS restricted in production
- Supabase IPs hashed (SHA-256, 16 chars, never raw)
- Validation before usage counting (bad requests don't waste quota)

---

## Supabase Schema

```sql
CREATE TABLE mood_searches (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mood_text VARCHAR(500) NOT NULL,
    energy VARCHAR(10),
    valence VARCHAR(10),
    genres TEXT[],
    language VARCHAR(20),
    song_name VARCHAR(200),
    song_artist VARCHAR(200),
    ip_hash VARCHAR(64)
);
```

RLS policies: allow insert + select from anon key.

---

## Key Design Decisions

- **Supabase** — free Postgres for persistent data (trending, heatmap, stats)
- **Gemini Flash Lite** — cheapest, fast, good enough. Upgrade to Flash when needed ($0.0003 vs $0.0006/request)
- **Spotify Search** over deprecated Recommendations API
- **Direct AI reco first** — better results than keyword search
- **Fallback songs** — app never returns empty results
- **IP-based tracking** — no accounts needed, IPs hashed for privacy
- **Aurora theme** — intentionally different from Tunelet's gold
- **Original content** — new taglines, original suggestions, emoji picks

---

## Planned Features (Not Built)

See `mood-dna.md` for the Mood DNA feature spec.

| Feature | Effort | Notes |
|---------|--------|-------|
| Mood DNA | Medium | Emotional profile from past moods (brainstormed, parked) |
| Daily Mood Prompt | Very Low | "Mood of the day" rotation |
| Playlist Mode | Medium | 10 songs + AI playlist name |
| Mood Match link | Medium | Shareable pre-filled mood URL |
| Mood Streak | Low | Daily check-in gamification |
| Razorpay integration | Medium | Premium features payment |
| localStorage history | Very Low | Persist sessions across refreshes |

---

## Other Docs (not committed, local only)

- `DEPLOYMENT.md` — step-by-step Vercel + Railway deploy guide
- `MONETIZE.md` — monetization strategy + Gemini cost math
- `nextPhase.md` — feature roadmap with completion status
- `architecture.md` — original system design
