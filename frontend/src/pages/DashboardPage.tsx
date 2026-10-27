
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { LANGUAGES } from '../lib/languages'
import { getDashboardProgress } from '../lib/api'
import type { DashboardProgress } from '../lib/api'
import { getSessionId } from '../lib/session'

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-[#121626] p-5 ${className}`}
    >
      {children}
    </section>
  )
}

function ActionLink({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-violet-400"
    >
      {children}
    </Link>
  )
}

export default function DashboardPage() {
  const { lang, level } = useLang()
  const language = LANGUAGES.find((item) => item.code === lang)

  const [progress, setProgress] = useState<DashboardProgress | null>(null)
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressError, setProgressError] = useState('')
  const [achievementNotification, setAchievementNotification] = useState<{
    title: string
    description: string
  } | null>(null)

  const achievementStorageKey = `speakify:unlocked:${getSessionId()}:${lang}`

  // Actualiza el progreso y detecta los logros nuevos.
  function applyProgress(data: DashboardProgress) {
    const unlockedIds = data.achievements
      .filter((achievement) => achievement.unlocked)
      .map((achievement) => achievement.id)

    try {
      const saved = window.sessionStorage.getItem(achievementStorageKey)

      // En la primera carga guardamos los logros existentes
      // sin mostrar notificaciones de logros antiguos.
      if (saved !== null) {
        const previousIds: unknown = JSON.parse(saved)

        if (
          Array.isArray(previousIds) &&
          previousIds.every((id) => typeof id === 'string')
        ) {
          const newlyUnlocked = data.achievements.find(
            (achievement) =>
              achievement.unlocked &&
              !previousIds.includes(achievement.id),
          )

          if (newlyUnlocked) {
            setAchievementNotification({
              title: newlyUnlocked.title,
              description: newlyUnlocked.description,
            })
          }
        }
      }

      window.sessionStorage.setItem(
        achievementStorageKey,
        JSON.stringify(unlockedIds),
      )
    } catch (error) {
      console.error('Error al guardar los logros:', error)
    }

    setProgress(data)
    setProgressError('')
  }

  // Cierra automáticamente la notificación después de unos segundos.
  useEffect(() => {
    if (!achievementNotification) return

    const timeout = window.setTimeout(() => {
      setAchievementNotification(null)
    }, 4500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [achievementNotification])

  // Carga inicial del progreso.
  useEffect(() => {
    let cancelled = false

    setProgressLoading(true)
    setProgressError('')
    setProgress(null)

    getDashboardProgress(getSessionId(), lang)
      .then((data) => {
        if (!cancelled) {
          applyProgress(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProgressError('No pudimos cargar tus estadísticas.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProgressLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [lang, achievementStorageKey])

  // Actualiza el progreso después de practicar o volver a la ventana.
  useEffect(() => {
    let cancelled = false

    const refreshProgress = () => {
      getDashboardProgress(getSessionId(), lang)
        .then((data) => {
          if (!cancelled) {
            applyProgress(data)
          }
        })
        .catch((error) => {
          console.error('No se pudo actualizar el progreso:', error)
        })
    }

    window.addEventListener(
      'speakify:activity-recorded',
      refreshProgress,
    )

    window.addEventListener('focus', refreshProgress)

    return () => {
      cancelled = true

      window.removeEventListener(
        'speakify:activity-recorded',
        refreshProgress,
      )

      window.removeEventListener('focus', refreshProgress)
    }
  }, [lang, achievementStorageKey])

  const stats = [
    {
      label: 'Actividades',
      value: progress?.total_activities ?? 0,
      icon: '📚',
      description: 'Actividades registradas',
    },
    {
      label: 'Días activos',
      value: progress?.active_days ?? 0,
      icon: '📅',
      description: 'Días en los que practicaste',
    },
    {
      label: 'Racha actual',
      value: progress?.current_streak ?? 0,
      icon: '🔥',
      description: 'Días consecutivos',
    },
    {
      label: 'Prácticas de voz',
      value: progress?.voice_sessions ?? 0,
      icon: '🎙️',
      description: 'Respuestas generadas en modo voz',
    },
  ]

  const maxCount = Math.max(
    1,
    ...(progress?.weekly_activity.map((day) => day.count) ?? [0]),
  )

  return (
    <div className="space-y-7 text-slate-100">
      {/* NOTIFICACIÓN DE NUEVO LOGRO */}
      {achievementNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-40px))] rounded-2xl border border-amber-300/30 bg-[#211b36] p-5 text-white shadow-2xl shadow-purple-950/50"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden="true">
              🏆
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                ¡Nuevo logro desbloqueado!
              </p>

              <h3 className="mt-1 font-bold">
                {achievementNotification.title}
              </h3>

              <p className="mt-1 text-sm text-slate-300">
                {achievementNotification.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAchievementNotification(null)}
              className="text-slate-400 hover:text-white"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative isolate overflow-hidden rounded-[28px] border border-violet-300/15 bg-gradient-to-br from-[#302c65] via-[#25244c] to-[#151a30] p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-12 -z-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 -z-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-violet-200">
              ✨ TU ESPACIO DE APRENDIZAJE
            </span>

            <h1 className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              ¡Vamos a aprender algo nuevo!
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              Cada conversación te acerca a tu objetivo. Practica un poco
              cada día y construye tu confianza.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-sm">
                🌍 {language?.name ?? lang}
              </span>

              <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-sm">
                🎯 Nivel {level}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink to="/learn">
                Explorar aprendizaje <span aria-hidden="true">→</span>
              </ActionLink>

              <Link
                to="/chat"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                💬 Practicar ahora
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-7xl shadow-2xl shadow-violet-950/40">
              🌎
            </div>
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS REALES */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Tu progreso</h2>
            <p className="mt-1 text-sm text-slate-400">
              Estadísticas para {language?.name ?? lang}
            </p>
          </div>

          {progressLoading && (
            <span className="text-xs text-slate-400">
              Actualizando…
            </span>
          )}
        </div>

        {progressError && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-200"
          >
            {progressError}

            <button
              type="button"
              onClick={() => {
                setProgressError('')
                setProgressLoading(true)

                getDashboardProgress(getSessionId(), lang)
                  .then(applyProgress)
                  .catch(() =>
                    setProgressError(
                      'No pudimos cargar tus estadísticas. Inténtalo de nuevo.',
                    ),
                  )
                  .finally(() => setProgressLoading(false))
              }}
              className="ml-2 font-bold underline underline-offset-4"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((stat) => (
            <Panel
              key={stat.label}
              className="transition hover:border-violet-300/20"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{stat.icon}</span>

                <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">
                  Real
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-400">{stat.label}</p>

              <p className="mt-1 text-3xl font-black tracking-tight">
                {progressLoading ? '—' : stat.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stat.description}
              </p>
            </Panel>
          ))}
        </div>
      </section>

      {/* NIVEL Y EXPERIENCIA */}
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">
                  Tu nivel de aprendizaje
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  Nivel {progress?.level ?? 1}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10 text-3xl">
                🏆
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-3">
              <p className="text-2xl font-black text-violet-300">
                {progressLoading ? '—' : progress?.total_xp ?? 0} XP
              </p>

              <p className="text-right text-xs text-slate-400">
                {progressLoading
                  ? 'Calculando...'
                  : `${progress?.xp_to_next_level ?? 100} XP para el siguiente nivel`}
              </p>
            </div>

            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Progreso hacia el siguiente nivel"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                progressLoading
                  ? 0
                  : progress?.level_progress_percent ?? 0
              }
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700"
                style={{
                  width: `${
                    progressLoading
                      ? 0
                      : Math.min(
                          100,
                          Math.max(
                            0,
                            progress?.level_progress_percent ?? 0,
                          ),
                        )
                  }%`,
                }}
              />
            </div>


<p className="mt-3 text-xs text-slate-500">
  Cada práctica te acerca al siguiente nivel. ¡Sigue así!
</p>

{/* META DIARIA DE XP */}
<div className="mt-6 border-t border-white/[0.08] pt-5">
  <div className="flex items-center justify-between gap-3">
    <div>
      <h3 className="text-sm font-bold">🎯 Meta diaria</h3>
      <p className="mt-1 text-xs text-slate-400">
        {progress?.daily_goal_completed
          ? '¡Meta completada! Excelente trabajo.'
          : `Te faltan ${progress?.daily_xp_remaining ?? 30} XP para alcanzar tu meta.`}
      </p>
    </div>

    <p className="shrink-0 text-sm font-bold text-violet-300">
      {progressLoading ? '—' : progress?.daily_xp ?? 0}
      {' / '}
      {progress?.daily_goal ?? 30} XP
    </p>
  </div>

  <div
    className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"
    role="progressbar"
    aria-label="Progreso de la meta diaria de XP"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={
      progressLoading ? 0 : progress?.daily_goal_progress ?? 0
    }
  >
    <div
      className={`h-full rounded-full transition-all duration-700 ${
        progress?.daily_goal_completed
          ? 'bg-gradient-to-r from-emerald-400 to-green-300'
          : 'bg-gradient-to-r from-violet-500 to-indigo-400'
      }`}
      style={{
        width: `${
          progressLoading ? 0 : progress?.daily_goal_progress ?? 0
        }%`,
      }}
    />
  </div>
</div>

          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Tus logros</h2>

              <p className="mt-1 text-sm text-slate-400">
                Reconocimientos por tu constancia.
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1.5 text-sm font-bold text-violet-200">
              {progressLoading
                ? '—'
                : `${progress?.unlocked_achievements ?? 0}/${progress?.total_achievements ?? 0}`}
            </span>
          </div>

          {progressLoading ? (
            <p className="mt-6 text-sm text-slate-400">
              Cargando tus logros...
            </p>
          ) : progressError ? (
            <p className="mt-6 text-sm text-slate-400">
              No pudimos cargar los logros.
            </p>
          ) : progress?.achievements?.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {progress.achievements.map((achievement) => {
                const percentage =
                  achievement.target > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          (achievement.current / achievement.target) * 100,
                        ),
                      )
                    : 0

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-2xl border p-4 transition ${
                      achievement.unlocked
                        ? 'border-violet-300/25 bg-violet-500/[0.08]'
                        : 'border-white/[0.07] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                          achievement.unlocked
                            ? 'bg-violet-500/15'
                            : 'bg-white/5 grayscale'
                        }`}
                      >
                        {achievement.unlocked ? '🏅' : '🔒'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold">
                          {achievement.title}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                      <span
                        className={
                          achievement.unlocked
                            ? 'font-semibold text-violet-300'
                            : 'text-slate-400'
                        }
                      >
                        {achievement.unlocked
                          ? 'Desbloqueado'
                          : 'En progreso'}
                      </span>

                      <span className="text-slate-400">
                        {Math.min(
                          achievement.current,
                          achievement.target,
                        )}
                        /{achievement.target}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          achievement.unlocked
                            ? 'bg-violet-400'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">
              Todavía no hay logros disponibles.
            </p>
          )}
        </Panel>
      </section>

      {/* ACCESOS A ACTIVIDADES */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Continúa practicando</h2>

          <p className="mt-1 text-sm text-slate-400">
            Elige una actividad para seguir aprendiendo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            to="/chat"
            className="group rounded-3xl border border-white/[0.08] bg-[#121626] p-5 transition hover:-translate-y-1 hover:border-violet-300/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">
              💬
            </div>

            <h3 className="mt-4 font-bold">Conversación con IA</h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Habla de tus intereses y practica el idioma a tu nivel.
            </p>

            <span className="mt-4 inline-block text-sm font-bold text-violet-300 group-hover:text-violet-200">
              Empezar conversación →
            </span>
          </Link>

          <Link
            to="/voz"
            className="group rounded-3xl border border-white/[0.08] bg-[#121626] p-5 transition hover:-translate-y-1 hover:border-violet-300/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">
              🎙️
            </div>

            <h3 className="mt-4 font-bold">Práctica de voz</h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Entrena tu expresión oral con las funciones de voz disponibles.
            </p>

            <span className="mt-4 inline-block text-sm font-bold text-violet-300 group-hover:text-violet-200">
              Practicar voz →
            </span>
          </Link>

          <Link
            to="/gramatica"
            className="group rounded-3xl border border-white/[0.08] bg-[#121626] p-5 transition hover:-translate-y-1 hover:border-violet-300/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-2xl">
              📚
            </div>

            <h3 className="mt-4 font-bold">Rincón de gramática</h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Refuerza las estructuras del idioma con ejercicios.
            </p>

            <span className="mt-4 inline-block text-sm font-bold text-violet-300 group-hover:text-violet-200">
              Ver ejercicios →
            </span>
          </Link>
        </div>
      </section>

      {/* ACTIVIDAD SEMANAL REAL */}
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Tu actividad semanal</h2>

            <p className="mt-1 text-sm text-slate-400">
              Actividades registradas en los últimos siete días.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            📈 Últimos 7 días
          </span>
        </div>

        {progressLoading ? (
          <p className="mt-8 text-sm text-slate-400">
            Cargando actividad…
          </p>
        ) : progress?.weekly_activity.length ? (
          <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-4">
            {progress.weekly_activity.map((day) => {
              const date = new Date(`${day.date}T12:00:00`)
              const height =
                day.count === 0
                  ? 6
                  : Math.max(16, (day.count / maxCount) * 100)

              return (
                <div
                  key={day.date}
                  className="flex min-w-0 flex-col items-center gap-2"
                >
                  <span className="text-xs font-semibold text-slate-300">
                    {day.count}
                  </span>

                  <div className="flex h-28 w-full items-end justify-center rounded-xl bg-white/[0.025] p-1">
                    <div
                      className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-violet-700 to-indigo-400 transition-all duration-500"
                      style={{ height: `${height}%` }}
                      title={`${day.count} actividades`}
                    />
                  </div>

                  <span className="text-[11px] text-slate-500 sm:text-xs">
                    {date
                      .toLocaleDateString('es-CO', {
                        weekday: 'short',
                      })
                      .replace('.', '')}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center">
            <div className="text-3xl">🌱</div>

            <p className="mt-3 font-semibold">
              Tu semana empieza aquí
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Completa una conversación o una práctica para ver tus
              primeras estadísticas.
            </p>

            <div className="mt-4">
              <ActionLink to="/chat">
                Comenzar a practicar
              </ActionLink>
            </div>
          </div>
        )}
      </Panel>

      {/* RESUMEN DE ACTIVIDADES */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-xl">
              💬
            </div>

            <div>
              <h3 className="font-bold">Conversaciones</h3>

              <p className="text-sm text-slate-400">
                Interacciones registradas con la IA
              </p>
            </div>
          </div>

          <p className="mt-5 text-3xl font-black">
            {progressLoading ? '—' : progress?.chat_sessions ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Respuestas generadas en modo chat
          </p>
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/10 text-xl">
              🧩
            </div>

            <div>
              <h3 className="font-bold">Gramática</h3>

              <p className="text-sm text-slate-400">
                Prácticas completadas
              </p>
            </div>
          </div>

          <p className="mt-5 text-3xl font-black">
            {progressLoading ? '—' : progress?.grammar_completions ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Intentos registrados
          </p>
        </Panel>
      </section>

      {/* PIE */}
      <footer className="pb-2 text-center text-xs leading-5 text-slate-500">
        Speakify AI · Progreso de {language?.name ?? lang} · Nivel {level}
      </footer>
    </div>
  )
}
