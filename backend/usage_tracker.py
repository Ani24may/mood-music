import time
from collections import defaultdict

from config import DAILY_FREE_LIMIT


class UsageTracker:
    """Track daily search usage per IP. Resets at midnight UTC."""

    def __init__(self):
        self._usage = defaultdict(lambda: {"count": 0, "date": ""})
        self._last_cleanup = time.time()

    def _today(self):
        return time.strftime("%Y-%m-%d", time.gmtime())

    def _periodic_cleanup(self):
        """Remove entries from previous days to prevent memory growth."""
        now = time.time()
        if now - self._last_cleanup < 600:
            return

        today = self._today()
        stale = [ip for ip, data in self._usage.items() if data["date"] != today]
        for ip in stale:
            del self._usage[ip]

        self._last_cleanup = now

    def check_and_increment(self, ip):
        """Check if IP has remaining searches and increment.
        Returns (allowed, remaining, limit)."""
        self._periodic_cleanup()

        today = self._today()
        entry = self._usage[ip]

        # Reset if new day
        if entry["date"] != today:
            entry["count"] = 0
            entry["date"] = today

        if entry["count"] >= DAILY_FREE_LIMIT:
            return False, 0, DAILY_FREE_LIMIT

        entry["count"] += 1
        remaining = DAILY_FREE_LIMIT - entry["count"]
        return True, remaining, DAILY_FREE_LIMIT

    def get_remaining(self, ip):
        """Get remaining searches without incrementing.
        Does NOT create new entries — prevents memory exhaustion from probing."""
        today = self._today()

        if ip not in self._usage:
            return DAILY_FREE_LIMIT

        entry = self._usage[ip]

        if entry["date"] != today:
            return DAILY_FREE_LIMIT

        return max(0, DAILY_FREE_LIMIT - entry["count"])


usage_tracker = UsageTracker()
