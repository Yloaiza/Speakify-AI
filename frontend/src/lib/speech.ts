
/* Voz de respuesta usando la síntesis del navegador. */

let preferredVoiceName: string | null = null

export function synthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function cleanForSpeech(text: string): string {
  return text.replace(/[*#_`>~]/g, '').replace(/\s+/g, ' ').trim()
}

/** Lista las voces disponibles en el navegador. */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!synthesisSupported()) return []
  return window.speechSynthesis.getVoices()
}

/** Permite elegir una voz por su nombre exacto. */
export function setPreferredVoice(name: string | null) {
  preferredVoiceName = name
}

export function speak(text: string, lang: string, onEnd?: () => void) {
  if (!synthesisSupported()) {
    onEnd?.()
    return
  }

  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text))
  utterance.lang = lang
  utterance.rate = 0.95
  utterance.pitch = 1

  const voices = synth.getVoices()
  const languagePrefix = lang.slice(0, 2).toLowerCase()

  const voice =
    voices.find((v) => v.name === preferredVoiceName) ??
    voices.find(
      (v) => v.lang.toLowerCase() === lang.toLowerCase() && v.localService === false,
    ) ??
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.slice(0, 2).toLowerCase() === languagePrefix)

  if (voice) utterance.voice = voice

  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()

  synth.speak(utterance)
}
 
export function stopSpeaking() {
  if (synthesisSupported()) window.speechSynthesis.cancel()
}
