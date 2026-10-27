import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLang } from '../context/LangContext'
import { streamChat, transcribeAudio } from '../lib/api'
import type { ChatMessage } from '../lib/api'
import { speechCode } from '../lib/languages'
import { recordingSupported, startRecording } from '../lib/recorder'
import type { ActiveRecording } from '../lib/recorder'
import { getSessionId } from '../lib/session'
import { speak, stopSpeaking, synthesisSupported } from '../lib/speech'

type Props = { mode: 'text' | 'voice' }

const GREETINGS: Record<string, string> = {
  en: 'Escribe o habla en inglés. Por ejemplo: "Hello! I want to practice English."',
  ja: '日本語で話してみましょう。Por ejemplo: "こんにちは！"',
  fr: 'Écris ou parle en français. Por ejemplo: "Bonjour ! Je veux pratiquer le français."',
}

function micErrorMessage(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
      return 'Permiso de micrófono denegado. Actívalo para este sitio en la configuración del navegador.'
    }
    if (e.name === 'NotFoundError') return 'No encontré un micrófono.'
    if (e.name === 'NotReadableError') return 'El micrófono está siendo usado por otra aplicación.'
  }
  return e instanceof Error ? e.message : 'No pude usar el micrófono.'
}

export default function ChatPanel({ mode }: Props) {
  const { lang, level } = useLang()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const recordingRef = useRef<ActiveRecording | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  const speechLang = speechCode(lang)
  const canRecord = recordingSupported()
  const busy = loading || transcribing

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Al salir de la página, callamos la voz y cerramos el micrófono.
  useEffect(() => {
    return () => {
      stopSpeaking()
      recordingRef.current?.stop()
    }
  }, [])

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || loading) return
    setError('')
    setInput('')
    stopSpeaking()
    setSpeaking(false)

    const next: ChatMessage[] = [...messagesRef.current, { role: 'user', content: clean }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setLoading(true)
    try {
      const full = await streamChat(
        { language: lang, level, mode, session_id: getSessionId(), messages: next },
        (partial) => setMessages([...next, { role: 'assistant', content: partial }]),
      )
      if (mode === 'voice' && full.trim()) {
        setSpeaking(true)
        speak(full, speechLang, () => setSpeaking(false))
      }
    } catch (e) {
      setMessages(next)
      setError(e instanceof Error ? e.message : 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  async function toggleMic() {
    setError('')
    if (listening) {
      recordingRef.current?.stop() // termina y transcribe lo grabado
      return
    }
    if (!canRecord) {
      setError('Tu navegador no permite grabar audio.')
      return
    }
    stopSpeaking()
    setSpeaking(false)
    try {
      const rec = await startRecording()
      recordingRef.current = rec
      setListening(true)
      const blob = await rec.done
      recordingRef.current = null
      setListening(false)
      if (!blob) {
        setError('No te escuché. Intenta de nuevo.')
        return
      }
      setTranscribing(true)
      const text = await transcribeAudio(blob, lang)
      setTranscribing(false)
      if (!text.trim()) {
        setError('No pude entender el audio. Intenta de nuevo.')
        return
      }
      if (mode === 'voice') await send(text)
      else setInput(text)
    } catch (e) {
      recordingRef.current = null
      setListening(false)
      setTranscribing(false)
      setError(micErrorMessage(e))
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  const micClasses = listening
    ? 'bg-red-600 animate-pulse'
    : 'bg-indigo-600 hover:bg-indigo-500'

  const voiceStatus = !canRecord
    ? 'Tu navegador no permite grabar audio'
    : listening
      ? 'Te escucho… se detiene sola cuando dejes de hablar (o toca el micrófono)'
      : transcribing
        ? 'Transcribiendo tu voz…'
        : loading
          ? 'Pensando…'
          : speaking
            ? 'Hablando…'
            : 'Toca el micrófono y habla'

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
        style={{ minHeight: '50vh', maxHeight: '60vh' }}
      >
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">{GREETINGS[lang]}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100'
              }`}
            >
              {m.content || (loading && i === messages.length - 1 ? '…' : '')}
              {m.role === 'assistant' && m.content && synthesisSupported() && (
                <button
                  onClick={() => speak(m.content, speechLang)}
                  className="ml-2 align-middle text-xs opacity-60 hover:opacity-100"
                  title="Escuchar"
                  type="button"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {mode === 'voice' ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => void toggleMic()}
            disabled={busy || !canRecord}
            type="button"
            className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl shadow-lg transition disabled:opacity-40 ${micClasses}`}
            aria-label={listening ? 'Detener micrófono' : 'Hablar'}
          >
            🎙️
          </button>
          <p className="text-center text-sm text-slate-400">{voiceStatus}</p>
          {speaking && (
            <button
              type="button"
              onClick={() => {
                stopSpeaking()
                setSpeaking(false)
              }}
              className="text-xs text-slate-400 underline"
            >
              Detener voz
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={transcribing ? 'Transcribiendo…' : 'Escribe tu mensaje…'}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          {canRecord && (
            <button
              type="button"
              onClick={() => void toggleMic()}
              disabled={busy}
              className={`rounded-xl px-4 text-lg disabled:opacity-40 ${micClasses}`}
              aria-label="Dictar"
            >
              🎙️
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-indigo-600 px-5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  )
}
