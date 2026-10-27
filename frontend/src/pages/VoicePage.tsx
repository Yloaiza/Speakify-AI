import ChatPanel from '../components/ChatPanel'
import { useLang } from '../context/LangContext'

export default function VoicePage() {
  const { lang, level } = useLang()
  return <ChatPanel key={`voice-${lang}-${level}`} mode="voice" />
}
