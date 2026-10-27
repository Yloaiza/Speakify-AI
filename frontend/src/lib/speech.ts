/* Voz de respuesta (texto -> voz) con la síntesis del navegador.
   El micrófono (voz -> texto) está en recorder.ts y se transcribe en el backend. */

export function synthesisSupported(): boolean {
  return 'speechSynthesis' in window
}

/** Quita símbolos de markdown para que no se lean en voz alta. */
function cleanForSpeech(text: string): string {
  return text.replace(/[*#_`>~]/g, '').replace(/\s+/g, ' ').trim()
}

export function speak(text: string, lang: string, onEnd?: () => void) {
  if (!synthesisSupported()) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text))
  utterance.lang = lang
  utterance.rate = 0.95
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)))
  if (voice) utterance.voice = voice
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (synthesisSupported()) window.speechSynthesis.cancel()
}
