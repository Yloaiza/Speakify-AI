import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import VoicePage from './pages/VoicePage'
import GrammarPage from './pages/GrammarPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/voz" element={<VoicePage />} />
          <Route path="/gramatica" element={<GrammarPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
