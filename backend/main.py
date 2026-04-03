import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config import ALLOWED_ORIGIN, APP_ENV, MAX_REQUEST_BODY_BYTES
from validators import validate_request
from rate_limiter import rate_limiter
from cache import mood_cache
from ai_service import parse_mood, generate_song_story, get_direct_recommendations
from spotify_service import search_songs, search_songs_by_recommendations

# Logging — never log secrets or full mood text in production
logging.basicConfig(
    level=logging.DEBUG if APP_ENV == "development" else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# === Security Middleware ===

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if APP_ENV != "development":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject request bodies larger than MAX_REQUEST_BODY_BYTES."""

    async def dispatch(self, request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > MAX_REQUEST_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"error": "Request body too large."},
                )
        return await call_next(request)


# App
app = FastAPI(
    title="Mood Music API",
    docs_url="/docs" if APP_ENV == "development" else None,
    redoc_url=None,
)

# Middleware (order matters — outermost first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)

# CORS
origins = ["*"] if APP_ENV == "development" else [ALLOWED_ORIGIN]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("  Mood Music API started")
    logger.info(f"  Mode: {APP_ENV}")
    # Don't log URLs/ports in production — reverse proxy handles it
    if APP_ENV == "development":
        logger.info("  URL:  http://localhost:3001")
        logger.info("  Docs: http://localhost:3001/docs")
    logger.info("=" * 50)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/generate-playlist")
async def generate_playlist(request: Request):
    # Rate limiting — use X-Forwarded-For when behind reverse proxy
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host

    is_limited, message = rate_limiter.is_rate_limited(client_ip)
    if is_limited:
        return JSONResponse(
            status_code=429,
            content={"error": message},
            headers={"Retry-After": "60"},
        )

    # Parse and validate request body
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid request body."},
        )

    mood, language, error = validate_request(body)
    if error:
        return JSONResponse(
            status_code=400,
            content={"error": error},
        )

    # Log truncated mood in production to avoid PII leakage
    if APP_ENV == "development":
        logger.info(f"Request: mood='{mood}', language='{language}'")
    else:
        logger.info(f"Request: mood_len={len(mood)}, language='{language}'")

    # Check L1 mood cache
    cache_key = mood_cache._make_key(mood.lower(), language)
    cached_tags = mood_cache.get(cache_key)

    songs = []
    tags = None

    if cached_tags:
        logger.info("Mood cache hit")
        tags = cached_tags
    else:
        # Try direct AI song recommendations first (better results)
        try:
            ai_tags, ai_songs = await get_direct_recommendations(mood, language)
            if ai_songs:
                tags = ai_tags
                songs = await search_songs_by_recommendations(ai_songs)
                logger.info(f"Direct reco: found {len(songs)} songs on Spotify")
        except Exception as e:
            logger.warning(f"Direct reco flow failed: {type(e).__name__}")

        # Fallback to keyword search if direct reco didn't work
        if not tags:
            tags = await parse_mood(mood)
            logger.info(f"Mood parsed (fallback): {tags}")

        mood_cache.set(cache_key, tags)

    # If no songs yet, use keyword search
    if not songs:
        try:
            songs = await search_songs(tags, language)
        except Exception as e:
            logger.error(f"Failed to search songs: {type(e).__name__}")
            return JSONResponse(
                status_code=503,
                content={"error": "Service temporarily unavailable. Please try again."},
            )

    if not songs:
        return JSONResponse(
            status_code=200,
            content={
                "songs": [],
                "message": "No songs matched your mood. Try something different?",
                "mood_tags": tags,
                "story": None,
            },
        )

    # Generate a poetic story for the first song
    story = None
    first_song = songs[0]
    try:
        story = await generate_song_story(mood, first_song["name"], first_song["artist"])
        if story:
            logger.info(f"Song story generated ({len(story)} chars)")
    except Exception as e:
        logger.warning(f"Story generation failed: {type(e).__name__}")

    return {
        "songs": songs,
        "mood_tags": tags,
        "story": story,
        "message": None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=3001, reload=False)
