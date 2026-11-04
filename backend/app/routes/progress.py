
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..auth import AuthenticatedUser, get_current_user
from ..prompts import LANGUAGES

router = APIRouter()

XP_REWARDS = {
    "chat": 10,
    "voice": 15,
    "grammar": 20,
}

XP_PER_LEVEL = 100


class ActivityRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=100)
    language: str
    activity_type: Literal["chat", "voice", "grammar"]
    reference_id: str | None = Field(default=None, max_length=100)


def parse_activity_date(value: str):
    """Convierte la fecha guardada en Supabase a una fecha UTC."""
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc).date()


def build_achievements(counts, active_dates, streak, total_xp):
    total_activities = sum(counts.values())

    definitions = [
        {
            "id": "first_steps",
            "title": "Primeros pasos",
            "description": "Completa tu primera actividad.",
            "current": total_activities,
            "target": 1,
        },
        {
            "id": "chat_starter",
            "title": "Conversador",
            "description": "Completa 10 actividades de chat.",
            "current": counts["chat"],
            "target": 10,
        },
        {
            "id": "voice_explorer",
            "title": "Voz valiente",
            "description": "Completa 5 actividades de voz.",
            "current": counts["voice"],
            "target": 5,
        },
        {
            "id": "grammar_master",
            "title": "Amante de la gramática",
            "description": "Completa 5 prácticas de gramática.",
            "current": counts["grammar"],
            "target": 5,
        },
        {
            "id": "three_day_streak",
            "title": "En racha",
            "description": "Mantén una racha de 3 días.",
            "current": streak,
            "target": 3,
        },
        {
            "id": "week_warrior",
            "title": "Guerrero semanal",
            "description": "Aprende durante 7 días distintos.",
            "current": len(active_dates),
            "target": 7,
        },
        {
            "id": "xp_500",
            "title": "Medio millar",
            "description": "Acumula 500 XP.",
            "current": total_xp,
            "target": 500,
        },
    ]

    for achievement in definitions:
        achievement["unlocked"] = (
            achievement["current"] >= achievement["target"]
        )
        achievement["progress"] = min(
            achievement["current"], achievement["target"]
        )

    return definitions


@router.post("/progress/activity")
async def create_activity(
    req: ActivityRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if req.language not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")

    try:
        await db.save_activity(
           current_user.id,
           req.session_id,
           req.language,
           req.activity_type,
           req.reference_id,
)

        return {
            "saved": True,
            "xp_earned": XP_REWARDS[req.activity_type],
        }

    except Exception as exc:
        print(f"[progress] no se pudo guardar la actividad: {exc}")
        raise HTTPException(
            503, "No pude guardar tu progreso"
        ) from exc


@router.get("/progress")
async def read_progress(
    session_id: str,
    language: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if not session_id.strip() or len(session_id) > 100:
        raise HTTPException(400, "session_id no válido")

    if language not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")

    try:
        rows = await db.get_activity_rows(
      current_user.id,
      session_id,
      language,
)

    except Exception as exc:
        print(f"[progress] no se pudo leer el progreso: {exc}")
        raise HTTPException(
            503, "No pude cargar tu progreso"
        ) from exc

    today = datetime.now(timezone.utc).date()
    counts = Counter(row["activity_type"] for row in rows)

    activity_dates = [
        parse_activity_date(row["created_at"])
        for row in rows
    ]
    active_dates = set(activity_dates)

    # Racha: cuenta hoy o ayer como el último día activo.
    streak = 0
    cursor = today if today in active_dates else today - timedelta(days=1)

    while cursor in active_dates:
        streak += 1
        cursor -= timedelta(days=1)

    # XP total y XP ganado hoy.
    total_xp = sum(
        XP_REWARDS.get(row["activity_type"], 0)
        for row in rows
    )

    daily_goal = 30

    daily_xp = sum(
        XP_REWARDS.get(row["activity_type"], 0)
        for row in rows
        if parse_activity_date(row["created_at"]) == today
    )

    daily_goal_progress = min(
        round(daily_xp / daily_goal * 100),
        100,
    )

    daily_xp_remaining = max(daily_goal - daily_xp, 0)
    daily_goal_completed = daily_xp >= daily_goal

    level = (total_xp // XP_PER_LEVEL) + 1
    xp_in_level = total_xp % XP_PER_LEVEL
    xp_to_next_level = XP_PER_LEVEL - xp_in_level

    # Actividad de los últimos siete días.
    week_start = today - timedelta(days=6)
    weekly_counts = Counter(
        activity_date.isoformat()
        for activity_date in activity_dates
        if week_start <= activity_date <= today
    )

    weekly_activity = [
        {
            "date": (week_start + timedelta(days=i)).isoformat(),
            "count": weekly_counts[
                (week_start + timedelta(days=i)).isoformat()
            ],
        }
        for i in range(7)
    ]

    achievements = build_achievements(
        counts, active_dates, streak, total_xp
    )

    return {
        "language": language,
        "total_activities": len(rows),
        "chat_sessions": counts["chat"],
        "voice_sessions": counts["voice"],
        "grammar_completions": counts["grammar"],
        "active_days": len(active_dates),
        "current_streak": streak,
        "weekly_activity": weekly_activity,
        "total_xp": total_xp,
        "daily_goal": daily_goal,
        "daily_xp": daily_xp,
        "daily_goal_progress": daily_goal_progress,
        "daily_xp_remaining": daily_xp_remaining,
        "daily_goal_completed": daily_goal_completed,
        "level": level,
        "xp_in_level": xp_in_level,
        "xp_per_level": XP_PER_LEVEL,
        "xp_to_next_level": xp_to_next_level,
        "level_progress_percent": round(
            xp_in_level / XP_PER_LEVEL * 100
        ),
        "achievements": achievements,
        "unlocked_achievements": sum(
            achievement["unlocked"]
            for achievement in achievements
        ),
        "total_achievements": len(achievements),
    }
