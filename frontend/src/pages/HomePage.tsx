
import { Link } from 'react-router-dom'

const features = [
  {
    icon: '💬',
    title: 'Conversaciones con IA',
    description:
      'Practica conversaciones sobre situaciones reales y gana confianza al expresarte.',
  },
  {
    icon: '🎙️',
    title: 'Entrena tu voz',
    description:
      'Mejora tu expresión oral y acostúmbrate a comunicarte en otro idioma.',
  },
  {
    icon: '📚',
    title: 'Domina la gramática',
    description:
      'Refuerza tus conocimientos con ejercicios para avanzar a tu propio ritmo.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0e19] text-white">
      {/* NAVEGACIÓN PÚBLICA */}
      <header className="relative z-10 border-b border-white/[0.07] bg-[#0b0e19]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 text-xl font-black shadow-lg shadow-violet-950/30">
              S
            </span>
            <span className="text-lg font-extrabold tracking-tight sm:text-xl">
              Speakify <span className="text-violet-400">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex"
            >
              Explorar plataforma
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
            >
              Comenzar gratis
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* PORTADA */}
        <section className="relative isolate">
          <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-40 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-32">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/[0.08] px-4 py-2 text-xs font-bold tracking-wide text-violet-200 sm:text-sm">
                ✨ TU PRÓXIMO IDIOMA EMPIEZA AQUÍ
              </span>

              <h1 className="mt-7 max-w-2xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Deja de estudiar solamente.
                <span className="mt-2 block bg-gradient-to-r from-violet-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                  Empieza a hablar.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Practica idiomas con inteligencia artificial, mejora tu
                pronunciación y aprende a tu ritmo. Cada conversación
                es una oportunidad para ganar confianza.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-950/30 transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Explorar Speakify
                  <span aria-hidden="true">→</span>
                </Link>

                <a
                  href="#funciones"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Descubrir funciones
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                <span>✓ Aprende a tu ritmo</span>
                <span>✓ Practica cuando quieras</span>
              </div>
            </div>

            {/* VISTA ILUSTRATIVA DEL PRODUCTO */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-indigo-500/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121626] shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                      ✨
                    </div>
                    <div>
                      <p className="text-sm font-bold">Tu práctica de hoy</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Aprende conversando
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    En progreso
                  </span>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] p-4">
                    <p className="text-xs font-bold text-violet-300">
                      SPEAKIFY AI
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Hi! What do you enjoy doing in your free time?
                    </p>
                  </div>

                  <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-600/25 to-indigo-600/20 p-4">
                    <p className="text-xs font-bold text-indigo-200">
                      TU RESPUESTA
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white">
                      I like listening to music and going to the gym.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                      <span>✓</span> ¡Vas por buen camino!
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Sigue practicando para expresarte con más naturalidad.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                      🎙️
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Sigue practicando</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Conversación · Voz · Gramática
                      </p>
                    </div>
                    <span className="text-xl text-violet-300">→</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-white/10 bg-[#191d30] px-4 py-3 shadow-xl sm:-left-7">
                <p className="text-xs text-slate-400">Tu objetivo</p>
                <p className="mt-1 text-sm font-bold">Hablar con confianza ✨</p>
              </div>
            </div>
          </div>
        </section>

        {/* FUNCIONES */}
        <section id="funciones" className="border-t border-white/[0.06] bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
                Aprende haciendo
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Todo empieza con una práctica
              </h2>
              <p className="mt-4 leading-7 text-slate-400">
                Desarrolla distintas habilidades con herramientas que te
                ayudan a incorporar el idioma a tu vida cotidiana.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-white/[0.08] bg-[#121626] p-6 transition hover:-translate-y-1 hover:border-violet-300/20 sm:p-7"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/10 bg-violet-500/10 text-3xl">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PLANES: PRESENTACIÓN INICIAL */}
        <section id="planes">
          <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
              Tu proceso, a tu ritmo
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Construye tu confianza un día a la vez
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">
              Explora las herramientas de Speakify y encuentra tu manera
              de practicar. Estamos construyendo nuevas formas de ayudarte
              a aprender.
            </p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Conocer la plataforma <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* PIE */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
          <p className="font-bold">
            Speakify <span className="text-violet-400">AI</span>
          </p>
          <p className="text-xs text-slate-500">
            Aprende a tu ritmo. Learn by speaking.
          </p>
        </div>
      </footer>
    </div>
  )
}
