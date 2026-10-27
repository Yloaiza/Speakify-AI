/* Grabadora de micrófono que funciona en cualquier navegador (Brave, Chrome, Edge, Safari).
   Graba con MediaRecorder, se detiene sola cuando dejas de hablar y convierte el audio
   a WAV (16 kHz, mono) para enviarlo al backend, donde Gemini lo transcribe. */

export type ActiveRecording = {
  /** Detiene la grabación manualmente. */
  stop: () => void
  /** Se resuelve con el WAV, o con null si no se oyó nada. */
  done: Promise<Blob | null>
}

const SPEECH_RMS = 0.03 // volumen mínimo para considerar que hablas
const SILENCE_MS = 1500 // silencio que cierra la grabación después de hablar
const NO_SPEECH_MS = 8000 // si no hablas en este tiempo, se cancela
const MAX_MS = 30000 // duración máxima

export function recordingSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return candidates.find((c) => MediaRecorder.isTypeSupported(c))
}

export async function startRecording(): Promise<ActiveRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  })
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  // Detección de silencio con un analizador de volumen.
  const ctx = new AudioContext()
  await ctx.resume()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Uint8Array(analyser.fftSize)

  let heardSpeech = false
  let forceSend = false
  const startedAt = performance.now()
  let lastSpeechAt = startedAt

  function halt() {
    if (recorder.state !== 'inactive') recorder.stop()
  }

  const timer = window.setInterval(() => {
    analyser.getByteTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / buf.length)
    const now = performance.now()
    if (rms > SPEECH_RMS) {
      heardSpeech = true
      lastSpeechAt = now
    }
    const tooLong = now - startedAt > MAX_MS
    const finishedSpeaking = heardSpeech && now - lastSpeechAt > SILENCE_MS
    const neverSpoke = !heardSpeech && now - startedAt > NO_SPEECH_MS
    if (tooLong || finishedSpeaking || neverSpoke) halt()
  }, 100)

  const done = new Promise<Blob | null>((resolve) => {
    recorder.onstop = async () => {
      window.clearInterval(timer)
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
      if ((!heardSpeech && !forceSend) || chunks.length === 0) {
        resolve(null)
        return
      }
      try {
        resolve(await toWav(new Blob(chunks, { type: recorder.mimeType })))
      } catch {
        resolve(null)
      }
    }
  })

  recorder.start()
  return {
    stop: () => {
      forceSend = true
      halt()
    },
    done,
  }
}

async function toWav(blob: Blob): Promise<Blob> {
  const decodeCtx = new AudioContext()
  const decoded = await decodeCtx.decodeAudioData(await blob.arrayBuffer())
  void decodeCtx.close()

  const targetRate = 16000
  const length = Math.max(1, Math.ceil(decoded.duration * targetRate))
  const offline = new OfflineAudioContext(1, length, targetRate)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()
  return encodeWav(rendered.getChannelData(0), targetRate)
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // tamaño del bloque fmt
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
