import time
from collections import defaultdict

from config import RATE_LIMIT_PER_IP, RATE_LIMIT_GLOBAL


class RateLimiter:
    """In-memory sliding window rate limiter with periodic cleanup."""

    def __init__(self):
        self._ip_requests = defaultdict(list)
        self._global_requests = []
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # Clean stale IPs every 5 minutes

    def _cleanup(self, timestamps, window_seconds=60):
        now = time.time()
        return [t for t in timestamps if now - t < window_seconds]

    def _periodic_cleanup(self):
        """Remove stale IP entries to prevent memory growth from many unique IPs."""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return

        stale_ips = [
            ip for ip, timestamps in self._ip_requests.items()
            if not timestamps or now - timestamps[-1] > 120
        ]
        for ip in stale_ips:
            del self._ip_requests[ip]

        self._last_cleanup = now

    def is_rate_limited(self, ip):
        """Check if request should be rate limited. Returns (is_limited, reason)."""
        self._periodic_cleanup()

        # Per-IP check
        self._ip_requests[ip] = self._cleanup(self._ip_requests[ip])
        if len(self._ip_requests[ip]) >= RATE_LIMIT_PER_IP:
            return True, "Too many requests. Please wait 60 seconds."

        # Global check
        self._global_requests = self._cleanup(self._global_requests)
        if len(self._global_requests) >= RATE_LIMIT_GLOBAL:
            return True, "Service is busy. Please try again shortly."

        # Record request
        self._ip_requests[ip].append(time.time())
        self._global_requests.append(time.time())

        return False, None


rate_limiter = RateLimiter()
