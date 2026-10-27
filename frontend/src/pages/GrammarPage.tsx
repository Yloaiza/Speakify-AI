
import { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { getLessons, getPractice, recordActivity } from '../lib/api'
import type { Lesson, Practice } from '../lib/api'
import { getSessionId } from '../lib/session'

export default function GrammarPage() {
  const { lang, level } = useLang()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [active, setActive] = useState<Lesson | null>(null)
  const [practice, setPractice] = useState<Practice | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setActive(null)
    setPractice(null)
    setAnswers({})
    setError('')
    setLessons([])
    setLoadingLessons(true)

    getLessons(lang, level)
      .then((data) => {
        if (!cancelled) setLessons(data)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingLessons(false)
      })

    return () => {
      cancelled = true
    }
  }, [lang, level])

  async function openLesson(lesson: Lesson) {
    setActive(lesson)
    setPractice(null)
    setAnswers({})
    setError('')
    setLoading(true)

    try {
      setPractice(await getPractice(lang, lesson.id, level))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!active) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {loadingLessons ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />

            <h3 className="mt-5 text-lg font-semibold text-white">
              Preparando tus temas de gramática...
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Estamos preparando el nivel {level}. Puede tardar unos segundos.
            </p>

            <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
            </div>
          </div>
        ) : error ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => {
                setError('')
                setLoadingLessons(true)

                void getLessons(lang, level)
                  .then(setLessons)
                  .catch((e: Error) => setError(e.message))
                  .finally(() => setLoadingLessons(false))
              }}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition hover:bg-indigo-500"
            >
              Reintentar
            </button>
          </div>
        ) : lessons.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-slate-400">
            No hay lecciones disponibles para el nivel {level}.
          </p>
        ) : (
          lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => void openLesson(l)}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-indigo-500"
            >
              <span className="rounded bg-indigo-600/20 px-2 py-0.5 text-xs text-indigo-300">
                {l.level}
              </span>
              <h3 className="mt-2 font-semibold">{l.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{l.summary}</p>
            </button>
          ))
        )}
      </div>
    )
  }

  const answered = Object.keys(answers).length
  const correct = practice
    ? practice.exercises.filter((ex, i) => answers[i] === ex.answer).length
    : 0

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setActive(null)
          setError('')
        }}
        className="text-sm text-slate-400 hover:text-white"
      >
        ← Volver a las lecciones
      </button>

      <h2 className="text-lg font-bold">{active.title}</h2>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
          <div>
            <p className="text-sm font-medium text-white">
              Preparando tu lección con IA...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Generando la explicación y los ejercicios del nivel {level}.
            </p>
          </div>
        </div>
      )}

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
              <div
                key={i}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <p className="mb-3 text-sm font-medium">
                  {i + 1}. {ex.question}
                </p>

                <div className="space-y-2">
                  {ex.options.map((opt, j) => {
                    let style = 'border-slate-700 hover:border-indigo-500'

                    if (done && j === ex.answer) {
                      style = 'border-green-500 bg-green-500/10'
                    } else if (done && j === chosen) {
                      style = 'border-red-500 bg-red-500/10'
                    }

                    return (
                      <button
                        key={j}
                        disabled={done}
                        onClick={() => {
                          const nextAnswers = { ...answers, [i]: j }
                          setAnswers(nextAnswers)

                          if (
                            practice &&
                            Object.keys(nextAnswers).length ===
                              practice.exercises.length
                          ) {
                            void recordActivity(
                              getSessionId(),
                              lang,
                              'grammar',
                              active.id,
                            ).catch((err) => {
                              console.error(
                                'No se pudo registrar la práctica:',
                                err,
                              )
                            })
                          }
                        }}
                        className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${style}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {done && (
                  <p className="mt-3 text-sm text-slate-300">💡 {ex.why}</p>
                )}
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
