from functools import lru_cache

from .. import config
from .base import LLMProvider
from .gemini import GeminiProvider


@lru_cache
def get_provider() -> LLMProvider:
    if not config.GEMINI_API_KEY:
        raise RuntimeError(
            "Falta GEMINI_API_KEY. Crea backend/.env a partir de .env.example"
        )
    return GeminiProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL)
