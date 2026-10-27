import { NavLink, Outlet } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { LANGUAGES, LEVELS } from '../lib/languages'
import type { LangCode } from '../lib/languages'

const links = [
  { to: '/', label: '💬 Chat' },
  { to: '/voz', label: '🎙️ Voz' },
  { to: '/gramatica', label: '📚 Gramática' },
]

export default function Layout() {
  const { lang, level, setLang, setLevel } = useLang()

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          Speakify <span className="text-indigo-400">AI</span>
        </h1>
        <div className="flex gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                Nivel {l}
              </option>
            ))}
          </select>
        </div>
      </header>

      <nav className="mb-4 flex gap-2 border-b border-slate-800 pb-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex flex-1 flex-col pb-6">
        <Outlet />
      </main>
    </div>
  )
}
