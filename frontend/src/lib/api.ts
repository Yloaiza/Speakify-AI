
import { supabase } from '../lib/superbase'

// En desarrollo usa el proxy de Vite (''). En producción define VITE_API_URL.
const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Tu sesión ha expirado. Inicia sesión de nuevo.')
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  }
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatParams = {
  language: string
  level: string
  mode: 'text' | 'voice'
  session_id: string
  messages: ChatMessage[]
}

/** Llama a /api/chat y entrega el texto acumulado mientras llega. */
export async function streamChat(
  params: ChatParams,
  onText: (fullText: string) => void,
): Promise<string> {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthHeaders(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok || !res.body) {
    let detail = 'Error del servidor'

    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      // Ignorar errores al leer la respuesta.
    }

    throw new Error(detail)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    full += decoder.decode(value, { stream: true })
    onText(full)
  }

  full += decoder.decode()
  return full
}

/** Envía el audio WAV al backend y devuelve el texto transcrito. */
export async function transcribeAudio(
  audio: Blob,
  language: string,
): Promise<string> {
  const form = new FormData()
  form.append('audio', audio, 'speech.wav')
  form.append('language', language)

  const res = await fetch(`${API}/api/transcribe`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: form,
  })

  if (!res.ok) {
    let detail = 'No pude transcribir el audio'

    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      // Ignorar errores al leer la respuesta.
    }

    throw new Error(detail)
  }

  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}

export type Lesson = {
  id: string
  title: string
  level: string
  summary: string
}

export type Exercise = {
  question: string
  options: string[]
  answer: number
  why: string
}

export type Practice = {
  explanation: string
  exercises: Exercise[]
}


const lessonsCache = new Map<string, Promise<Lesson[]>>()

export function getLessons(lang: string, level: string): Promise<Lesson[]> {
  const key = `${lang}:${level}`

  const cached = lessonsCache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({ level })

  const request = fetch(
    `${API}/api/grammar/${lang}?${params.toString()}`
  ).then(async (res) => {
    if (!res.ok) {
      throw new Error('No pude cargar las lecciones')
    }

    return res.json() as Promise<Lesson[]>
  })

  lessonsCache.set(key, request)

  // Si falla, permite volver a intentar la solicitud.
  request.catch(() => {
    if (lessonsCache.get(key) === request) {
      lessonsCache.delete(key)
    }
  })

  return request
}



export async function getPractice(
  language: string,
  lessonId: string,
  level: string,
): Promise<Practice> {
  const res = await fetch(`${API}/api/grammar/practice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthHeaders(),
    },
    body: JSON.stringify({
      language,
      lesson_id: lessonId,
      level,
    }),
  })

  if (!res.ok) {
    let detail = 'No pude generar la lección'

    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      // Ignorar errores al leer la respuesta.
    }

    throw new Error(detail)
  }

  return res.json()
}


export type Achievement = {
  id: string
  title: string
  description: string
  current: number
  target: number
  unlocked: boolean
  progress: number
}

export type DashboardProgress = {
  language: string
  total_activities: number
  chat_sessions: number
  voice_sessions: number
  grammar_completions: number
  active_days: number
  current_streak: number
  weekly_activity: { date: string; count: number }[]

  // Gamificación
  total_xp: number

  // Meta diaria
  daily_goal: number
  daily_xp: number
  daily_goal_progress: number
  daily_xp_remaining: number
  daily_goal_completed: boolean
  level: number
  xp_in_level: number
  xp_per_level: number
  xp_to_next_level: number
  level_progress_percent: number
  achievements: Achievement[]
  unlocked_achievements: number
  total_achievements: number
}

export async function recordActivity(
  sessionId: string,
  language: string,
  activityType: 'chat' | 'voice' | 'grammar',
  referenceId?: string,
): Promise<void> {
  const res = await fetch(`${API}/api/progress/activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthHeaders(),
    },
    body: JSON.stringify({
      session_id: sessionId,
      language,
      activity_type: activityType,
      reference_id: referenceId,
    }),
  })

  if (!res.ok) {
    let detail = 'No pude guardar tu progreso'

    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      // Ignorar errores al leer la respuesta.
    }

    throw new Error(detail)
  }
}

export async function getDashboardProgress(
  sessionId: string,
  language: string,
): Promise<DashboardProgress> {
  const params = new URLSearchParams({
    session_id: sessionId,
    language,
  })

  const res = await fetch(`${API}/api/progress?${params.toString()}`, {
    headers: await getAuthHeaders(),
  })

  if (!res.ok) {
    let detail = 'No pude cargar tu progreso'

    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      // Ignorar errores al leer la respuesta.
    }

    throw new Error(detail)
  }

  return res.json()
}
