import json
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..prompts import LANGUAGES, LEVELS, build_grammar_prompt
from ..providers import get_provider

router = APIRouter()

LESSONS = json.loads(
    (Path(__file__).parent.parent / "data" / "grammar.json").read_text(
        encoding="utf-8"
    )
)

# Guarda las lecciones generadas durante la ejecución del backend.
GENERATED_LESSONS: dict[str, list[dict]] = {}


class PracticeRequest(BaseModel):
    language: str
    lesson_id: str
    level: str = "A1"


def _clean_json(text: str) -> dict:
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, count=1, flags=re.I)
        text = re.sub(r"\s*```$", "", text)

    return json.loads(text)


def _cache_key(lang: str, level: str) -> str:
    return f"{lang}:{level}"


def _find_lesson(lang: str, lesson_id: str, level: str) -> dict:
    # Busca primero las lecciones generadas para el idioma y nivel.
    generated = GENERATED_LESSONS.get(_cache_key(lang, level), [])

    for lesson in generated:
        if lesson["id"] == lesson_id:
            return lesson

    # También permite utilizar lecciones existentes en grammar.json.
    for lesson in LESSONS.get(lang, []):
        if lesson["id"] == lesson_id and lesson["level"] == level:
            return lesson

    raise HTTPException(404, "Lección no encontrada para este nivel")


async def _generate_lessons(lang: str, level: str) -> list[dict]:
    info = LANGUAGES[lang]

    prompt = f"""
Genera exactamente 8 temas diferentes de gramática de {info['name']}
para estudiantes hispanohablantes de nivel {level} del MCER.

Respeta estrictamente el nivel solicitado:
- A1: estructuras fundamentales y frases sencillas.
- A2: estructuras básicas ampliadas y situaciones cotidianas.
- B1: estructuras intermedias y comunicación independiente.
- B2: estructuras avanzadas, argumentación y matices.
- C1: gramática avanzada, precisión, registro y estructuras complejas.

No incluyas temas demasiado sencillos para el nivel solicitado.
Adapta los temas al idioma y evita repetir el mismo tema con títulos distintos.

Devuelve exclusivamente JSON válido con esta estructura:
{{
  "lessons": [
    {{
      "id": "identificador-unico",
      "title": "Título del tema",
      "level": "{level}",
      "summary": "Descripción breve en español",
      "focus": "Puntos gramaticales específicos que se deben enseñar"
    }}
  ]
}}

Reglas:
- Genera exactamente 8 temas.
- Cada id debe ser único, corto y estar escrito en minúsculas.
- Todos los temas deben tener exactamente el nivel {level}.
- Cada tema debe incluir los cinco campos indicados.
- No incluyas Markdown ni texto fuera del JSON.
"""

    try:
        provider = get_provider()
        raw = await provider.generate(
            build_grammar_prompt(lang, level),
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        data = _clean_json(raw)

        lessons = data.get("lessons")

        if not isinstance(lessons, list) or len(lessons) != 8:
            raise ValueError("La IA debe generar exactamente 8 temas")

        validated = []
        used_ids = set()

        for index, lesson in enumerate(lessons):
            if not isinstance(lesson, dict):
                raise ValueError("Una lección tiene un formato inválido")

            title = lesson.get("title")
            summary = lesson.get("summary")
            focus = lesson.get("focus")

            if not all(
                isinstance(value, str) and value.strip()
                for value in (title, summary, focus)
            ):
                raise ValueError("Una lección tiene campos vacíos")

            if lesson.get("level") != level:
                raise ValueError("La IA devolvió un nivel incorrecto")

            raw_id = str(lesson.get("id", f"tema-{index + 1}")).lower()
            slug = re.sub(r"[^a-z0-9-]+", "-", raw_id).strip("-")

            if not slug:
                slug = f"tema-{index + 1}"

            lesson_id = f"generated-{lang}-{level.lower()}-{slug}"

            # Garantiza que los IDs sean únicos.
            if lesson_id in used_ids:
                lesson_id = f"{lesson_id}-{index + 1}"

            used_ids.add(lesson_id)

            validated.append(
                {
                    "id": lesson_id,
                    "title": title.strip(),
                    "level": level,
                    "summary": summary.strip(),
                    "focus": focus.strip(),
                }
            )

        return validated

    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"[grammar] respuesta inválida al generar lecciones: {exc}")
        raise HTTPException(
            502,
            "La IA devolvió lecciones inválidas. Intenta de nuevo.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[grammar] error generando lecciones: {exc}")
        raise HTTPException(
            502,
            "No pude generar las lecciones. Intenta de nuevo.",
        )


@router.get("/grammar/{lang}")
async def list_lessons(lang: str, level: str = "A1"):
    if lang not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")

    if level not in LEVELS:
        raise HTTPException(400, "Nivel no soportado")

    # Genera los 8 temas para cada idioma y nivel.
    # No depende de los temas que existan en grammar.json.
    key = _cache_key(lang, level)

    if key not in GENERATED_LESSONS:
        GENERATED_LESSONS[key] = await _generate_lessons(lang, level)

    # El frontend no necesita recibir los puntos internos de gramática.
    return [
        {k: v for k, v in lesson.items() if k != "focus"}
        for lesson in GENERATED_LESSONS[key]
    ]


@router.post("/grammar/practice")
async def practice(req: PracticeRequest):
    if req.language not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")

    if req.level not in LEVELS:
        raise HTTPException(400, "Nivel no soportado")

    lesson = _find_lesson(req.language, req.lesson_id, req.level)
    level = req.level

    prompt = f"""
Tema de gramática: "{lesson['title']}" (nivel {level}).
Puntos clave que debes cubrir: {lesson['focus']}

Genera contenido apropiado estrictamente para el nivel {level} del MCER.
No simplifiques el tema a nivel A1 si el estudiante está en un nivel superior.

Devuelve un JSON con esta estructura:
{{
  "explanation": "explicación clara en español, 120-200 palabras, con 3 ejemplos en el idioma meta y su traducción",
  "exercises": [
    {{
      "question": "pregunta o frase con hueco en el idioma meta",
      "options": ["opción A", "opción B", "opción C"],
      "answer": 0,
      "why": "explicación breve en español de por qué esa es la correcta"
    }}
  ]
}}

Genera exactamente 5 ejercicios.
"answer" debe ser el índice (0, 1 o 2) de la opción correcta.
Distribuye las respuestas correctas entre las tres posiciones.
Las opciones deben ser distintas y solo una debe ser correcta.
Devuelve exclusivamente JSON válido, sin Markdown.
"""

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
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"[grammar] JSON inválido en práctica: {exc}")
        raise HTTPException(
            502,
            "La IA devolvió un formato inválido. Intenta de nuevo.",
        )
    except Exception as exc:
        print(f"[grammar] error generando práctica: {exc}")
        raise HTTPException(
            502,
            "No pude generar los ejercicios. Intenta de nuevo.",
        )

    exercises = data.get("exercises")

    if (
        not isinstance(data.get("explanation"), str)
        or not isinstance(exercises, list)
        or len(exercises) != 5
    ):
        raise HTTPException(
            502,
            "La IA devolvió una práctica incompleta. Intenta de nuevo.",
        )

    for exercise in exercises:
        if (
            not isinstance(exercise, dict)
            or not isinstance(exercise.get("question"), str)
            or not isinstance(exercise.get("options"), list)
            or len(exercise["options"]) != 3
            or not all(isinstance(option, str) for option in exercise["options"])
            or type(exercise.get("answer")) is not int
            or exercise["answer"] not in (0, 1, 2)
            or not isinstance(exercise.get("why"), str)
        ):
            raise HTTPException(
                502,
                "La IA devolvió un ejercicio con formato inválido. Intenta de nuevo.",
            )

    return data
