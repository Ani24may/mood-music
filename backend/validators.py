import re
from config import MAX_MOOD_LENGTH, VALID_LANGUAGES


def sanitize_mood(mood):
    """Sanitize mood text input."""
    if not mood or not mood.strip():
        return None, "Mood is required."

    mood = mood.strip()

    if len(mood) > MAX_MOOD_LENGTH:
        return None, f"Mood text must be under {MAX_MOOD_LENGTH} characters."

    # Strip HTML tags
    mood = re.sub(r"<[^>]+>", "", mood)

    # Remove control characters
    mood = re.sub(r"[\x00-\x1f\x7f]", "", mood)

    # Collapse multiple spaces
    mood = re.sub(r"\s+", " ", mood).strip()

    if not mood:
        return None, "Mood is required."

    return mood, None


def validate_language(language):
    """Validate language selection."""
    if not language:
        return None, "Language is required."

    if language not in VALID_LANGUAGES:
        return None, f"Invalid language. Choose from: {', '.join(VALID_LANGUAGES)}"

    return language, None


def validate_request(data):
    """Validate the full request body. Returns (mood, language, error)."""
    if not data:
        return None, None, "Invalid request body."

    mood, error = sanitize_mood(data.get("mood"))
    if error:
        return None, None, error

    language, error = validate_language(data.get("language"))
    if error:
        return None, None, error

    return mood, language, None
