export type LangCode = 'en' | 'ja' | 'fr'

export const LANGUAGES: { code: LangCode; name: string; flag: string; speech: string }[] = [
  { code: 'en', name: 'Inglés', flag: '🇬🇧', speech: 'en-US' },
  { code: 'ja', name: 'Japonés', flag: '🇯🇵', speech: 'ja-JP' },
  { code: 'fr', name: 'Francés', flag: '🇫🇷', speech: 'fr-FR' },
]

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

export function speechCode(code: LangCode): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? 'en-US'
}
