import ChatPanel from '../components/ChatPanel'
import { useLang } from '../context/LangContext'

export default function ChatPage() {
  const { lang, level } = useLang()
  // La key reinicia la conversación al cambiar de idioma o nivel.
  return <ChatPanel key={`text-${lang}-${level}`} mode="text" />
}
