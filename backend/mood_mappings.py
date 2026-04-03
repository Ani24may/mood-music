# Predefined mood -> music attribute mappings
# Used as fallback when AI service is unavailable

MOOD_MAP = {
    "sad": {
        "energy": "low",
        "valence": "negative",
        "genres": ["acoustic", "soft"],
        "search_keywords": ["sad", "melancholic"],
    },
    "happy": {
        "energy": "high",
        "valence": "positive",
        "genres": ["pop", "dance"],
        "search_keywords": ["happy", "upbeat"],
    },
    "angry": {
        "energy": "high",
        "valence": "negative",
        "genres": ["rock", "metal"],
        "search_keywords": ["angry", "intense"],
    },
    "chill": {
        "energy": "low",
        "valence": "positive",
        "genres": ["lofi", "ambient"],
        "search_keywords": ["chill", "relaxing"],
    },
    "party": {
        "energy": "high",
        "valence": "positive",
        "genres": ["edm", "dance"],
        "search_keywords": ["party", "club"],
    },
    "romantic": {
        "energy": "medium",
        "valence": "positive",
        "genres": ["rnb", "soul"],
        "search_keywords": ["love", "romantic"],
    },
    "focus": {
        "energy": "low",
        "valence": "neutral",
        "genres": ["classical", "ambient"],
        "search_keywords": ["focus", "concentration"],
    },
    "energetic": {
        "energy": "high",
        "valence": "positive",
        "genres": ["pop", "electronic"],
        "search_keywords": ["energetic", "pump up"],
    },
    "lonely": {
        "energy": "low",
        "valence": "negative",
        "genres": ["indie", "acoustic"],
        "search_keywords": ["lonely", "alone"],
    },
    "peaceful": {
        "energy": "low",
        "valence": "positive",
        "genres": ["ambient", "classical"],
        "search_keywords": ["peaceful", "calm"],
    },
    "nostalgic": {
        "energy": "medium",
        "valence": "neutral",
        "genres": ["retro", "oldies"],
        "search_keywords": ["nostalgic", "memories"],
    },
    "motivational": {
        "energy": "high",
        "valence": "positive",
        "genres": ["hip hop", "pop"],
        "search_keywords": ["motivation", "workout"],
    },
}

DEFAULT_MAPPING = {
    "energy": "medium",
    "valence": "neutral",
    "genres": ["pop"],
    "search_keywords": ["mood", "vibes"],
}

# Hinglish / romanized Hindi keyword mappings for fallback
HINGLISH_MAP = {
    "udaas": "sad",
    "dukhi": "sad",
    "rona": "sad",
    "khush": "happy",
    "mast": "happy",
    "accha": "happy",
    "gussa": "angry",
    "pyaar": "romantic",
    "ishq": "romantic",
    "mohabbat": "romantic",
    "akela": "lonely",
    "tanha": "lonely",
    "sukoon": "peaceful",
    "chain": "peaceful",
    "josh": "energetic",
    "party": "party",
    "chill": "chill",
    "yaadein": "nostalgic",
    "purani": "nostalgic",
}


def fallback_mood_parse(mood_text):
    """Match mood text against predefined mappings using keyword matching.
    Supports English and Hinglish (romanized Hindi) keywords."""
    mood_lower = mood_text.lower()

    # Check English keywords first
    for keyword, mapping in MOOD_MAP.items():
        if keyword in mood_lower:
            return mapping.copy()

    # Check Hinglish keywords
    for hinglish_word, english_mood in HINGLISH_MAP.items():
        if hinglish_word in mood_lower:
            return MOOD_MAP[english_mood].copy()

    return DEFAULT_MAPPING.copy()
