// Id anónimo por navegador, para agrupar los mensajes en Supabase sin necesidad de login.
export function getSessionId(): string {
  try {
    let id = localStorage.getItem('speakify_session')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('speakify_session', id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}
