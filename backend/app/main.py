from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .prompts import LANGUAGES, LEVELS
from .routes import chat, grammar, transcribe

app = FastAPI(title="Speakify AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(grammar.router, prefix="/api")
app.include_router(transcribe.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "gemini_configured": bool(config.GEMINI_API_KEY),
        "supabase_configured": bool(config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY),
    }


@app.get("/api/languages")
async def languages():
    return {
        "languages": [
            {"code": code, "name": info["name"], "native": info["native"], "speech": info["speech"]}
            for code, info in LANGUAGES.items()
        ],
        "levels": LEVELS,
    }
