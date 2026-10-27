import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LangCode } from '../lib/languages'

type LangState = {
  lang: LangCode
  level: string
  setLang: (l: LangCode) => void
  setLevel: (l: string) => void
}

const LangContext = createContext<LangState | null>(null)

function load<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback
  } catch {
    return fallback
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>(() => load<LangCode>('speakify_lang', 'en'))
  const [level, setLevel] = useState<string>(() => load('speakify_level', 'A1'))

  useEffect(() => {
    try {
      localStorage.setItem('speakify_lang', lang)
      localStorage.setItem('speakify_level', level)
    } catch {
      /* ignorar */
    }
  }, [lang, level])

  return <LangContext.Provider value={{ lang, level, setLang, setLevel }}>{children}</LangContext.Provider>
}

export function useLang(): LangState {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang debe usarse dentro de LangProvider')
  return ctx
}
