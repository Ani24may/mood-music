import hashlib
import time
from collections import OrderedDict


class LRUCache:
    """In-memory LRU cache with TTL expiration."""

    def __init__(self, max_size=10000, ttl_seconds=3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._store = OrderedDict()

    def _make_key(self, *parts):
        raw = ":".join(str(p) for p in parts)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, key):
        if key not in self._store:
            return None

        entry = self._store[key]
        if time.time() - entry["timestamp"] > self.ttl_seconds:
            del self._store[key]
            return None

        self._store.move_to_end(key)
        return entry["value"]

    def set(self, key, value):
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = {"value": value, "timestamp": time.time()}

        if len(self._store) > self.max_size:
            self._store.popitem(last=False)

    def clear(self):
        self._store.clear()

    @property
    def size(self):
        return len(self._store)


# L1: Mood -> AI tags (TTL: 1 hour)
mood_cache = LRUCache(max_size=10000, ttl_seconds=3600)

# L2: Spotify query -> song results (TTL: 30 minutes)
spotify_cache = LRUCache(max_size=5000, ttl_seconds=1800)

# L3: Spotify auth token (TTL: 55 minutes)
token_cache = LRUCache(max_size=1, ttl_seconds=3300)
