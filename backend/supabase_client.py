import hashlib
import logging

import httpx

from config import SUPABASE_URL, SUPABASE_KEY, SSL_VERIFY

logger = logging.getLogger(__name__)


def _hash_ip(ip):
    """Hash IP for privacy — never store raw IPs."""
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


async def record_mood(mood_text, tags, language, song_name, song_artist, client_ip):
    """Insert mood search into Supabase. Fire-and-forget — doesn't block response."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return

    data = {
        "mood_text": mood_text[:500],
        "energy": tags.get("energy"),
        "valence": tags.get("valence"),
        "genres": tags.get("genres", []),
        "language": language,
        "song_name": song_name,
        "song_artist": song_artist,
        "ip_hash": _hash_ip(client_ip),
    }

    try:
        async with httpx.AsyncClient(timeout=5, verify=SSL_VERIFY) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/mood_searches",
                json=data,
                headers={**_headers(), "Prefer": "return=minimal"},
            )
            response.raise_for_status()
            logger.info("Mood recorded to Supabase")
    except Exception as e:
        logger.warning(f"Supabase insert failed: {type(e).__name__}")


async def get_trending(limit=10):
    """Get top moods from recent searches."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []

    try:
        async with httpx.AsyncClient(timeout=5, verify=SSL_VERIFY) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/mood_searches",
                params={
                    "select": "mood_text",
                    "order": "created_at.desc",
                    "limit": 500,
                },
                headers=_headers(),
            )
            response.raise_for_status()
            rows = response.json()

        # Count mood frequency
        from collections import Counter
        counts = Counter(row["mood_text"].lower().strip() for row in rows)
        trending = [
            {"mood": mood, "count": count}
            for mood, count in counts.most_common(limit)
            if count >= 2
        ]
        return trending

    except Exception as e:
        logger.warning(f"Supabase trending query failed: {type(e).__name__}")
        return []


async def get_stats():
    """Get search stats from Supabase — replaces in-memory stats_tracker."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"today": {"searches": 0, "unique_visitors": 0}, "history": [], "total_searches": 0}

    try:
        async with httpx.AsyncClient(timeout=5, verify=SSL_VERIFY) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/mood_searches",
                params={
                    "select": "created_at,ip_hash",
                    "order": "created_at.desc",
                    "limit": 2000,
                },
                headers=_headers(),
            )
            response.raise_for_status()
            rows = response.json()

        if not rows:
            return {"today": {"searches": 0, "unique_visitors": 0}, "history": [], "total_searches": 0}

        # Group by date
        from collections import defaultdict
        daily = defaultdict(lambda: {"searches": 0, "ips": set()})
        for row in rows:
            date = row["created_at"].split("T")[0]
            daily[date]["searches"] += 1
            daily[date]["ips"].add(row["ip_hash"])

        # Build history (last 7 days)
        sorted_dates = sorted(daily.keys(), reverse=True)
        history = []
        for date in sorted_dates[:7]:
            history.append({
                "date": date,
                "searches": daily[date]["searches"],
                "unique_visitors": len(daily[date]["ips"]),
            })

        today_str = sorted_dates[0] if sorted_dates else ""
        today_data = daily.get(today_str, {"searches": 0, "ips": set()})

        return {
            "today": {
                "date": today_str,
                "searches": today_data["searches"],
                "unique_visitors": len(today_data["ips"]),
            },
            "history": history,
            "total_searches": len(rows),
        }

    except Exception as e:
        logger.warning(f"Supabase stats query failed: {type(e).__name__}")
        return {"today": {"searches": 0, "unique_visitors": 0}, "history": [], "total_searches": 0}


async def get_mood_history(client_ip, days=30):
    """Get mood history for a specific IP (hashed)."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []

    ip_hash = _hash_ip(client_ip)

    try:
        async with httpx.AsyncClient(timeout=5, verify=SSL_VERIFY) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/mood_searches",
                params={
                    "select": "created_at,mood_text,energy,valence,song_name,song_artist",
                    "ip_hash": f"eq.{ip_hash}",
                    "order": "created_at.desc",
                    "limit": 100,
                },
                headers=_headers(),
            )
            response.raise_for_status()
            return response.json()

    except Exception as e:
        logger.warning(f"Supabase history query failed: {type(e).__name__}")
        return []
