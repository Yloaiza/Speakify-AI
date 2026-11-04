
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { LANGUAGES, LEVELS } from '../lib/languages'
import type { LangCode } from '../lib/languages'
import { supabase } from '../lib/superbase'

const navigation = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠', end: true },
  { to: '/learn', label: 'Aprender', icon: '🗺️', end: false },
  { to: '/chat', label: 'Conversar', icon: '💬', end: false },
  { to: '/voz', label: 'Voz', icon: '🎙️', end: false },
  { to: '/gramatica', label: 'Gramática', icon: '📚', end: false },
]

function NavItems({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="Navegación principal"
      className={
        mobile
          ? 'flex gap-2 overflow-x-auto px-4 py-3 md:hidden'
          : 'hidden flex-col gap-2 md:flex'
      }
    >
      {navigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/30'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
            }`
          }
        >
          <span className="text-xl" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { lang, level, setLang, setLevel } = useLang()
  const navigate = useNavigate()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error.message)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0b0e19] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.07] bg-[#101321] px-5 py-7 md:flex">
          <NavLink to="/dashboard" className="mb-12 flex items-center gap-3 px-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 text-2xl font-black shadow-lg shadow-violet-900/30">
              S
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Speakify <span className="text-violet-400">AI</span>
            </span>
          </NavLink>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Tu espacio
          </p>

          <NavItems />

          <div className="mt-auto overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-fuchsia-500/10 p-5">
            <div className="mb-3 text-3xl">🚀</div>
            <p className="font-bold">Pequeños pasos, grandes logros</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Cada conversación es una oportunidad para mejorar.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-violet-500" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0b0e19]/90 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-9">
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2 md:hidden"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-600 font-black">
                  S
                </span>
                <span className="font-bold">
                  Speakify <span className="text-violet-400">AI</span>
                </span>
              </NavLink>

              <div className="hidden min-w-0 flex-1 md:block">
                <p className="font-semibold">
                  Tu próximo paso empieza aquí ✨
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Practica algo nuevo hoy.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="learning-language">
                  Idioma de aprendizaje
                </label>
                <select
                  id="learning-language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as LangCode)}
                  className="max-w-[135px] rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-sm outline-none transition focus:border-violet-400"
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.flag} {item.name}
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor="learning-level">
                  Nivel de aprendizaje
                </label>
                <select
                  id="learning-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="max-w-[115px] rounded-xl border border-white/10 bg-[#171a2a] px-3 py-2.5 text-sm outline-none transition focus:border-violet-400"
                >
                  {LEVELS.map((item) => (
                    <option key={item} value={item}>
                      Nivel {item}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            <NavItems mobile />
          </header>

          <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9">
            <div className="mx-auto w-full max-w-[1500px]">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-white/[0.06] px-6 py-4 text-center text-xs text-slate-600">
            Speakify AI · Learn by speaking.
          </footer>
        </div>
      </div>
    </div>
  )
}
