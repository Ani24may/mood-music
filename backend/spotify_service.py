import logging
import urllib.parse

import httpx

from config import (
    SSL_VERIFY,
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_TIMEOUT_MS,
    USE_MOCKS,
    MOCK_SPOTIFY,
)
from cache import spotify_cache, token_cache

logger = logging.getLogger(__name__)

LANGUAGE_MAP = {
    "Tamil": {"keyword": "tamil"},
    "Hindi": {"keyword": "bollywood"},
    "English": {"keyword": "pop"},
    "Telugu": {"keyword": "telugu"},
    "Any": {"keyword": ""},
}

MOCK_SONGS = [
    {
        "name": "Ennai Konjam",
        "artist": "Sid Sriram",
        "image": "https://via.placeholder.com/300x300.png?text=Album+1",
        "spotify_url": "https://open.spotify.com/track/mock1",
        "preview_url": None,
    },
    {
        "name": "Venmathi Venmathiye",
        "artist": "Bombay Jayashri",
        "image": "https://via.placeholder.com/300x300.png?text=Album+2",
        "spotify_url": "https://open.spotify.com/track/mock2",
        "preview_url": None,
    },
    {
        "name": "Munbe Vaa",
        "artist": "Shreya Ghoshal",
        "image": "https://via.placeholder.com/300x300.png?text=Album+3",
        "spotify_url": "https://open.spotify.com/track/mock3",
        "preview_url": None,
    },
    {
        "name": "Kannazhaga",
        "artist": "Dhanush, Shruti Haasan",
        "image": "https://via.placeholder.com/300x300.png?text=Album+4",
        "spotify_url": "https://open.spotify.com/track/mock4",
        "preview_url": None,
    },
    {
        "name": "Nenjukkul Peidhidum",
        "artist": "Harris Jayaraj",
        "image": "https://via.placeholder.com/300x300.png?text=Album+5",
        "spotify_url": "https://open.spotify.com/track/mock5",
        "preview_url": None,
    },
    {
        "name": "Idhazhin Oram",
        "artist": "Ajesh Ashok",
        "image": "https://via.placeholder.com/300x300.png?text=Album+6",
        "spotify_url": "https://open.spotify.com/track/mock6",
        "preview_url": None,
    },
    {
        "name": "Oru Kadhal Devathai",
        "artist": "Karthik",
        "image": "https://via.placeholder.com/300x300.png?text=Album+7",
        "spotify_url": "https://open.spotify.com/track/mock7",
        "preview_url": None,
    },
    {
        "name": "Thalli Pogathey",
        "artist": "Sid Sriram",
        "image": "https://via.placeholder.com/300x300.png?text=Album+8",
        "spotify_url": "https://open.spotify.com/track/mock8",
        "preview_url": None,
    },
    {
        "name": "Kadhale Kadhale",
        "artist": "Sid Sriram",
        "image": "https://via.placeholder.com/300x300.png?text=Album+9",
        "spotify_url": "https://open.spotify.com/track/mock9",
        "preview_url": None,
    },
    {
        "name": "Vaan Varuvaan",
        "artist": "Karthik",
        "image": "https://via.placeholder.com/300x300.png?text=Album+10",
        "spotify_url": "https://open.spotify.com/track/mock10",
        "preview_url": None,
    },
]


def _build_query(tags, language):
    """Build Spotify search query from mood tags and language."""
    lang_info = LANGUAGE_MAP.get(language, LANGUAGE_MAP["Any"])

    parts = []
    parts.extend(tags.get("search_keywords", []))
    parts.extend(tags.get("genres", []))

    if lang_info["keyword"]:
        parts.append(lang_info["keyword"])

    query = " ".join(parts)
    return query


async def _get_spotify_token():
    """Get Spotify access token using Client Credentials flow."""
    cached = token_cache.get("spotify_token")
    if cached:
        return cached

    url = "https://accounts.spotify.com/api/token"
    data = {"grant_type": "client_credentials"}
    auth = (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)

    timeout = SPOTIFY_TIMEOUT_MS / 1000
    async with httpx.AsyncClient(timeout=timeout, verify=SSL_VERIFY) as client:
        response = await client.post(url, data=data, auth=auth)
        response.raise_for_status()

        result = response.json()
        token = result["access_token"]
        token_cache.set("spotify_token", token)
        return token


def _parse_tracks(data):
    """Extract track info from Spotify search response."""
    tracks = []
    items = data.get("tracks", {}).get("items", [])

    for item in items:
        if not item.get("name") or not item.get("artists"):
            continue

        images = item.get("album", {}).get("images", [])
        image_url = images[0]["url"] if images else ""

        external_urls = item.get("external_urls", {})
        spotify_url = external_urls.get("spotify", "")

        artist_names = ", ".join(a["name"] for a in item["artists"] if a.get("name"))

        preview_url = item.get("preview_url")

        # Generate YouTube Music fallback if no preview
        youtube_url = None
        if not preview_url:
            search_term = urllib.parse.quote(f"{item['name']} {artist_names}")
            youtube_url = f"https://music.youtube.com/search?q={search_term}"

        tracks.append(
            {
                "name": item["name"],
                "artist": artist_names,
                "image": image_url,
                "spotify_url": spotify_url,
                "preview_url": preview_url,
                "youtube_url": youtube_url,
            }
        )

    return tracks


async def _spotify_search(query, limit=10, retries=2):
    """Call Spotify Search API with retry logic."""
    token = await _get_spotify_token()

    params = {"q": query, "type": "track", "limit": limit}

    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.spotify.com/v1/search"

    timeout = SPOTIFY_TIMEOUT_MS / 1000

    for attempt in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout, verify=SSL_VERIFY) as client:
                response = await client.get(url, params=params, headers=headers)

                if response.status_code == 401:
                    # Token expired, refresh and retry
                    token_cache.clear()
                    token = await _get_spotify_token()
                    headers["Authorization"] = f"Bearer {token}"
                    continue

                if response.status_code == 403:
                    logger.error(f"Spotify 403 response body: {response.text}")
                    response.raise_for_status()

                if response.status_code == 429:
                    if attempt < retries:
                        import asyncio
                        wait = int(response.headers.get("Retry-After", 1))
                        await asyncio.sleep(min(wait, 3))
                        continue
                    response.raise_for_status()

                response.raise_for_status()
                return response.json()

        except httpx.TimeoutException:
            if attempt < retries:
                continue
            raise

    return None


async def search_specific_song(song_name, artist):
    """Search Spotify for a specific song by name and artist.
    Returns a single track dict or None."""
    query = f"track:{song_name} artist:{artist}"

    try:
        data = await _spotify_search(query, limit=1)
        tracks = _parse_tracks(data)
        if tracks:
            return tracks[0]
    except httpx.HTTPStatusError as e:
        logger.warning(f"Failed to find '{song_name}' by {artist}: HTTP {e.response.status_code}")
    except Exception as e:
        logger.warning(f"Failed to find '{song_name}' by {artist}: {type(e).__name__}")

    # Fallback: simpler search without field qualifiers
    try:
        query = f"{song_name} {artist}"
        data = await _spotify_search(query, limit=1)
        tracks = _parse_tracks(data)
        if tracks:
            return tracks[0]
    except httpx.HTTPStatusError as e:
        logger.warning(f"Fallback search failed for '{song_name}': HTTP {e.response.status_code}")
    except Exception as e:
        logger.warning(f"Fallback search failed for '{song_name}': {type(e).__name__}")

    return None


async def search_songs_by_recommendations(ai_songs):
    """Search Spotify for each AI-recommended song.
    Returns list of found tracks."""
    found_tracks = []

    for song in ai_songs:
        track = await search_specific_song(song["name"], song["artist"])
        if track:
            found_tracks.append(track)

    logger.info(f"Found {len(found_tracks)}/{len(ai_songs)} AI-recommended songs on Spotify")
    return found_tracks


async def search_songs(tags, language):
    """Search Spotify for songs matching mood tags and language.
    Implements broadening strategy if no results found."""
    if USE_MOCKS or MOCK_SPOTIFY:
        logger.info("Using mock Spotify response (mock mode)")
        return MOCK_SONGS

    query = _build_query(tags, language)

    # Check L2 cache
    cache_key = spotify_cache._make_key(query)
    cached = spotify_cache.get(cache_key)
    if cached:
        logger.info("Spotify cache hit")
        return cached

    # Try the full query first
    try:
        data = await _spotify_search(query)
        tracks = _parse_tracks(data)

        if tracks:
            spotify_cache.set(cache_key, tracks)
            return tracks

        # Broaden: drop genres, keep keywords + language
        keywords = tags.get("search_keywords", [])
        lang_keyword = LANGUAGE_MAP.get(language, {}).get("keyword", "")

        broaden_queries = [
            " ".join(keywords + ([lang_keyword] if lang_keyword else [])),
            f"{lang_keyword} songs" if lang_keyword else " ".join(keywords),
            " ".join(keywords) + " music",
        ]

        for bquery in broaden_queries:
            if not bquery.strip():
                continue
            data = await _spotify_search(bquery)
            tracks = _parse_tracks(data)
            if tracks:
                spotify_cache.set(cache_key, tracks)
                return tracks

        return []

    except httpx.HTTPStatusError as e:
        logger.error(f"Spotify API error: {e.response.status_code}")
        raise

    except httpx.TimeoutException:
        logger.error("Spotify API timed out")
        raise

    except Exception as e:
        logger.error(f"Spotify search error: {type(e).__name__}")
        raise
