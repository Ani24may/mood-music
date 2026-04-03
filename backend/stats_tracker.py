import time
from collections import defaultdict, OrderedDict


class StatsTracker:
    """Track daily search stats. Keeps last 7 days in memory."""

    MAX_DAYS = 7

    def __init__(self):
        self._daily = OrderedDict()  # {"2026-04-03": {"searches": 0, "unique_ips": set()}}
        self._total_searches = 0

    def _today(self):
        return time.strftime("%Y-%m-%d", time.gmtime())

    def _ensure_day(self, date):
        if date not in self._daily:
            self._daily[date] = {"searches": 0, "unique_ips": set()}
            # Prune old days
            while len(self._daily) > self.MAX_DAYS:
                self._daily.popitem(last=False)

    def record(self, ip):
        """Record a search from an IP."""
        today = self._today()
        self._ensure_day(today)
        self._daily[today]["searches"] += 1
        self._daily[today]["unique_ips"].add(ip)
        self._total_searches += 1

    def get_stats(self):
        """Return stats for the last 7 days."""
        today = self._today()
        self._ensure_day(today)

        days = []
        for date, data in self._daily.items():
            days.append({
                "date": date,
                "searches": data["searches"],
                "unique_visitors": len(data["unique_ips"]),
            })

        today_data = self._daily.get(today, {"searches": 0, "unique_ips": set()})

        return {
            "today": {
                "date": today,
                "searches": today_data["searches"],
                "unique_visitors": len(today_data["unique_ips"]),
            },
            "history": list(reversed(days)),
            "total_searches_since_restart": self._total_searches,
        }


stats_tracker = StatsTracker()
