# Mood Music

Type how you're feeling. Get the perfect song.

**Live:** [mood-music-ebon.vercel.app](https://mood-music-ebon.vercel.app)

---

## What is this?

A web app that turns your mood into music. Type anything — a feeling, a moment, a vibe — in English, Hindi, Hinglish, Tamil, or Telugu, and AI finds a song that matches. You also get a poetic story about why that song fits your mood.

### Examples

```
"3am overthinking again"        → gets you a late-night introspective track
"aaj accha nhi lag raha h"      → understands Hinglish, finds something soothing
"just got good news"            → picks an upbeat celebration song
"monsoon chai on the balcony"   → finds the perfect rainy day vibe
```

## Features

- **AI-powered mood matching** — Gemini AI parses your mood into music attributes and recommends specific songs
- **Poetic song story** — AI writes a 4-5 sentence description of why the song matches your feeling
- **Multi-language** — supports English, Hindi, Tamil, Telugu, and Hinglish (romanized Hindi)
- **Voice search** — tap the mic and speak your mood (language-aware)
- **Emoji quick-picks** — one-tap moods for when you can't find the words
- **Audio preview** — listen to a preview without leaving the app (Spotify embed)
- **Share cards** — generate a beautiful 1080x1350 image to share on Instagram/Twitter
- **Mood-reactive UI** — background colors shift based on your mood's energy and emotion
- **Mobile-first** — responsive bottom sheet design, works on all screen sizes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python FastAPI |
| AI | Google Gemini (Flash Lite) |
| Music Data | Spotify Web API |
| Hosting | Vercel (frontend) + Railway (backend) |

## How It Works

```
You type a mood
     |
     v
AI parses it into energy, valence, genres
     |
     v
AI recommends 10 specific songs
     |
     v
Each song is verified on Spotify
     |
     v
AI writes a poetic story for the top match
     |
     v
You see the result with audio preview + share card
```

## Run Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- Spotify API credentials ([developer.spotify.com](https://developer.spotify.com/dashboard))
- Gemini API key ([aistudio.google.com](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
mood-music/
├── backend/
│   ├── main.py              # FastAPI app + security middleware
│   ├── ai_service.py        # Gemini/OpenAI mood parsing + song story
│   ├── spotify_service.py   # Spotify auth + search + track parsing
│   ├── mood_mappings.py     # Fallback mappings + Hinglish keywords
│   ├── cache.py             # 3-layer LRU cache
│   ├── rate_limiter.py      # Per-IP + global rate limiting
│   ├── validators.py        # Input sanitization
│   ├── config.py            # Environment config
│   ├── .env.example         # Template for API keys
│   ├── requirements.txt     # Python dependencies
│   ├── Procfile             # Railway start command
│   └── Dockerfile           # Container build
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app + state management
│   │   ├── App.css          # All styles (aurora theme, responsive)
│   │   ├── api.js           # API client
│   │   └── components/
│   │       ├── MoodInput.jsx          # Search + voice + emoji picks
│   │       ├── SongResult.jsx         # Result card (bottom sheet)
│   │       ├── AudioPreview.jsx       # Spotify embed player
│   │       ├── BackgroundAnimation.jsx # Mood-reactive particles
│   │       └── ErrorDisplay.jsx       # Error states
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── railway.toml             # Railway deployment config
├── Dockerfile               # Backend container
└── CLAUDE.md                # Full project guide
```

## Environment Variables

Create `backend/.env` from `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify app credentials |
| `SPOTIFY_CLIENT_SECRET` | Yes | Spotify app credentials |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `APP_ENV` | No | `development` or `production` |
| `ALLOWED_ORIGIN` | No | CORS origin (default: `http://localhost:5173`) |

See `.env.example` for the full list.

## Security

- API keys stored in environment variables, never in code
- Input sanitization (HTML strip, control chars, 500 char limit)
- Per-IP rate limiting (5 req/min) + global limit (100 req/min)
- Security headers (HSTS, CSP, X-Frame-Options, nosniff)
- Request body size limit (2KB)
- AI prompt injection protection
- No PII in production logs

## API

### `POST /generate-playlist`

```json
// Request
{ "mood": "feeling nostalgic", "language": "Hindi" }

// Response
{
  "songs": [{ "name": "...", "artist": "...", "image": "...", "spotify_url": "..." }],
  "mood_tags": { "energy": "low", "valence": "neutral", "genres": ["..."] },
  "story": "A poetic description of why this song matches...",
  "message": null
}
```

### `GET /health`

Returns `{"status": "ok"}`

## License

MIT

---

Built with AI + Spotify. Made in India.
