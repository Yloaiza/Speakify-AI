
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

const lessons = [
  {
    title: 'Primeras palabras',
    description: 'Empieza a expresarte con confianza.',
    icon: '🌱',
    status: 'Disponible',
    to: '/chat',
  },
  {
    title: 'Habla en voz alta',
    description: 'Practica escuchar y responder.',
    icon: '🎙️',
    status: 'Disponible',
    to: '/voz',
  },
  {
    title: 'Construye frases',
    description: 'Aprende a organizar tus ideas.',
    icon: '🧩',
    status: 'Disponible',
    to: '/gramatica',
  },
  {
    title: 'Conversación libre',
    description: 'Usa lo aprendido en una charla.',
    icon: '💬',
    status: 'Disponible',
    to: '/chat',
  },
]

export default function LearnPage() {
  const { lang, level } = useLang()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl border border-violet-300/15 bg-gradient-to-br from-indigo-900/60 to-[#121626] p-6 sm:p-8">
        <p className="text-sm font-semibold text-violet-300">
          TU CAMINO DE APRENDIZAJE
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Cada paso cuenta ✨
        </h1>
        <p className="mt-3 text-slate-300">
          Explora las actividades y encuentra tu siguiente reto.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
          🌍 Idioma: {lang.toUpperCase()} · Nivel: {level}
        </div>
      </div>

      <div className="relative mt-8 space-y-5">
        {lessons.map((lesson, index) => (
          <div
            key={lesson.title}
            className={`flex gap-4 sm:gap-6 ${
              index % 2 === 1 ? 'sm:ml-16' : 'sm:mr-16'
            }`}
          >
            <div className="flex w-14 shrink-0 flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/25 to-indigo-500/10 text-2xl shadow-lg shadow-violet-950/20 transition hover:scale-110">
                {lesson.icon}
              </div>
              {index < lessons.length - 1 && (
                <div className="my-2 min-h-8 w-0.5 flex-1 rounded-full bg-gradient-to-b from-violet-400/50 to-indigo-400/10" />
              )}
            </div>

            <div className="mb-3 flex-1 rounded-2xl border border-white/[0.08] bg-[#121626] p-5 transition hover:border-violet-300/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                  Misión {index + 1}
                </span>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {lesson.status}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold">{lesson.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {lesson.description}
              </p>

              <Link
                to={lesson.to}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold transition hover:bg-violet-500"
              >
                Comenzar misión <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-slate-500">
        Camino inicial de demostración. Los estados, las recompensas y el
        progreso persistente se implementarán en una siguiente fase.
      </p>
    </div>
  )
}
