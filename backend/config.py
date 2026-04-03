import os
from dotenv import load_dotenv

load_dotenv()

# Environment
APP_ENV = os.getenv("APP_ENV", "development")
USE_MOCKS = os.getenv("USE_MOCKS", "false").lower() == "true"
MOCK_AI = os.getenv("MOCK_AI", "false").lower() == "true"
MOCK_SPOTIFY = os.getenv("MOCK_SPOTIFY", "false").lower() == "true"
SSL_VERIFY = os.getenv("SSL_VERIFY", "false").lower() == "true"

# Spotify
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")

# AI Service
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# App Config
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")
RATE_LIMIT_PER_IP = int(os.getenv("RATE_LIMIT_PER_IP", "5"))
RATE_LIMIT_GLOBAL = int(os.getenv("RATE_LIMIT_GLOBAL", "100"))
AI_TIMEOUT_MS = int(os.getenv("AI_TIMEOUT_MS", "3000"))
SPOTIFY_TIMEOUT_MS = int(os.getenv("SPOTIFY_TIMEOUT_MS", "5000"))

# Validation
MAX_MOOD_LENGTH = 500
MAX_REQUEST_BODY_BYTES = 2048  # 2KB max request body
VALID_LANGUAGES = ["Tamil", "Hindi", "English", "Telugu", "Any"]
