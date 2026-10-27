// En desarrollo usa el proxy de Vite (''). En producción define VITE_API_URL.
const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ChatParams = {
  language: string
  level: string
  mode: 'text' | 'voice'
  session_id: string
  messages: ChatMessage[]
}

/** Llama a /api/chat y va entregando el texto acumulado mientras llega. */
export async function streamChat(
  params: ChatParams,
  onText: (fullText: string) => void,
): Promise<string> {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok || !res.body) {
    let detail = 'Error del servidor'
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      /* ignorar */
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
  return full
}

/** Envía el audio (WAV) al backend y devuelve el texto transcrito. */
export async function transcribeAudio(audio: Blob, language: string): Promise<string> {
  const form = new FormData()
  form.append('audio', audio, 'speech.wav')
  form.append('language', language)
  const res = await fetch(`${API}/api/transcribe`, { method: 'POST', body: form })
  if (!res.ok) {
    let detail = 'No pude transcribir el audio'
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      /* ignorar */
    }
    throw new Error(detail)
  }
  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}

export type Lesson = { id: string; title: string; level: string; summary: string }

export type Exercise = {
  question: string
  options: string[]
  answer: number
  why: string
}

export type Practice = { explanation: string; exercises: Exercise[] }

export async function getLessons(lang: string): Promise<Lesson[]> {
  const res = await fetch(`${API}/api/grammar/${lang}`)
  if (!res.ok) throw new Error('No pude cargar las lecciones')
  return res.json()
}

export async function getPractice(language: string, lessonId: string): Promise<Practice> {
  const res = await fetch(`${API}/api/grammar/practice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, lesson_id: lessonId }),
  })
  if (!res.ok) {
    let detail = 'No pude generar la lección'
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      /* ignorar */
    }
    throw new Error(detail)
  }
  return res.json()
}
