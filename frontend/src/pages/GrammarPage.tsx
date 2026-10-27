import { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { getLessons, getPractice } from '../lib/api'
import type { Lesson, Practice } from '../lib/api'

export default function GrammarPage() {
  const { lang } = useLang()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [active, setActive] = useState<Lesson | null>(null)
  const [practice, setPractice] = useState<Practice | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setActive(null)
    setPractice(null)
    setError('')
    getLessons(lang)
      .then(setLessons)
      .catch((e: Error) => setError(e.message))
  }, [lang])

  async function openLesson(lesson: Lesson) {
    setActive(lesson)
    setPractice(null)
    setAnswers({})
    setError('')
    setLoading(true)
    try {
      setPractice(await getPractice(lang, lesson.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!active) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {error && <p className="col-span-full text-sm text-red-400">{error}</p>}
        {lessons.map((l) => (
          <button
            key={l.id}
            onClick={() => void openLesson(l)}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-indigo-500"
          >
            <span className="rounded bg-indigo-600/20 px-2 py-0.5 text-xs text-indigo-300">{l.level}</span>
            <h3 className="mt-2 font-semibold">{l.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{l.summary}</p>
          </button>
        ))}
      </div>
    )
  }

  const answered = Object.keys(answers).length
  const correct = practice
    ? practice.exercises.filter((ex, i) => answers[i] === ex.answer).length
    : 0

  return (
    <div className="space-y-4">
      <button onClick={() => setActive(null)} className="text-sm text-slate-400 hover:text-white">
        ← Volver a las lecciones
      </button>
      <h2 className="text-lg font-bold">{active.title}</h2>

      {loading && <p className="text-sm text-slate-400">Preparando tu lección con IA…</p>}
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => void openLesson(active)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500"
          >
            Reintentar
          </button>
        </div>
      )}

      {practice && (
        <>
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm leading-relaxed">
            {practice.explanation}
          </div>

          <h3 className="pt-2 font-semibold">Practica</h3>
          {practice.exercises.map((ex, i) => {
            const chosen = answers[i]
            const done = chosen !== undefined
            return (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="mb-3 text-sm font-medium">
                  {i + 1}. {ex.question}
                </p>
                <div className="space-y-2">
                  {ex.options.map((opt, j) => {
                    let style = 'border-slate-700 hover:border-indigo-500'
                    if (done && j === ex.answer) style = 'border-green-500 bg-green-500/10'
                    else if (done && j === chosen) style = 'border-red-500 bg-red-500/10'
                    return (
                      <button
                        key={j}
                        disabled={done}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                        className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${style}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {done && <p className="mt-3 text-sm text-slate-300">💡 {ex.why}</p>}
              </div>
            )
          })}

          {answered === practice.exercises.length && (
            <div className="rounded-2xl bg-indigo-600/20 p-4 text-center">
              <p className="font-semibold">
                Resultado: {correct} / {practice.exercises.length}
              </p>
              <button
                onClick={() => void openLesson(active)}
                className="mt-2 text-sm text-indigo-300 underline"
              >
                Generar nuevos ejercicios
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
