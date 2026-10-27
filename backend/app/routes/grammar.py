import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..prompts import LANGUAGES, LEVELS, build_grammar_prompt
from ..providers import get_provider

router = APIRouter()

LESSONS = json.loads(
    (Path(__file__).parent.parent / "data" / "grammar.json").read_text(encoding="utf-8")
)


class PracticeRequest(BaseModel):
    language: str
    lesson_id: str


def _find_lesson(lang: str, lesson_id: str) -> dict:
    for lesson in LESSONS.get(lang, []):
        if lesson["id"] == lesson_id:
            return lesson
    raise HTTPException(404, "Leccion no encontrada")


def _clean_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text)


@router.get("/grammar/{lang}")
async def list_lessons(lang: str):
    if lang not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")
    return [
        {k: v for k, v in lesson.items() if k != "focus"}
        for lesson in LESSONS.get(lang, [])
    ]


@router.post("/grammar/practice")
async def practice(req: PracticeRequest):
    if req.language not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")
    lesson = _find_lesson(req.language, req.lesson_id)
    level = lesson["level"] if lesson["level"] in LEVELS else "A1"

    prompt = f"""Tema de gramática: "{lesson['title']}" (nivel {level}).
Puntos clave que debes cubrir: {lesson['focus']}

Devuelve un JSON con esta forma exacta:
{{
  "explanation": "explicación clara en español, 120-200 palabras, con 3 ejemplos en el idioma meta y su traducción",
  "exercises": [
    {{
      "question": "pregunta o frase con hueco (en el idioma meta, con ayuda en español si hace falta)",
      "options": ["opción A", "opción B", "opción C"],
      "answer": 0,
      "why": "explicación breve en español de por qué esa es la correcta"
    }}
  ]
}}
Genera exactamente 5 ejercicios. "answer" es el índice (0, 1 o 2) de la opción correcta.
Haz que las respuestas correctas no estén siempre en la misma posición."""

    try:
        provider = get_provider()
        raw = await provider.generate(
            build_grammar_prompt(req.language, level),
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        data = _clean_json(raw)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(502, "La IA devolvio un formato invalido, intenta de nuevo")
    except Exception as exc:
        print(f"[gemini] error: {exc}")
        raise HTTPException(502, "No pude contactar a la IA, intenta de nuevo")

    if "explanation" not in data or not isinstance(data.get("exercises"), list):
        raise HTTPException(502, "Respuesta incompleta de la IA, intenta de nuevo")
    return data
