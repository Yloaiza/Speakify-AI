# Speakify AI

App web para aprender idiomas (inglés, japonés y francés) con un tutor de IA: chat de texto, conversación por voz y lecciones de gramática.

**Stack:** React + Vite + TypeScript + Tailwind · FastAPI (Python) · Gemini API · Supabase

## Requisitos en Mac

```bash
# Con Homebrew (https://brew.sh)
brew install node python
node -v     # 20 o superior
python3 -V  # 3.10 o superior
```

## 1. Consigue tus claves

- **Gemini:** entra a https://aistudio.google.com/apikey y crea una API key gratis.
- **Supabase (opcional al inicio):** crea un proyecto en https://supabase.com, ve a *SQL Editor*, pega el contenido de `supabase/schema.sql` y ejecútalo. Luego, en *Project Settings > API*, copia la **Project URL** y la **service_role key**.
  - La service_role key es secreta: solo va en `backend/.env`, nunca en el frontend ni en GitHub.

## 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # y edítalo con tus claves
uvicorn app.main:app --reload --port 8000
```

Comprueba que funciona abriendo http://localhost:8000/api/health

## 3. Frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

## Cómo está organizado

```
backend/app/
  main.py            app FastAPI y CORS
  config.py          variables de entorno
  prompts.py         system prompts por idioma, nivel y modo (texto/voz)
  providers/         capa LLMProvider (hoy Gemini; puedes añadir Groq u Ollama)
  routes/chat.py     POST /api/chat (streaming)
  routes/grammar.py  GET /api/grammar/{lang}, POST /api/grammar/practice
  data/grammar.json  temas de gramática definidos por ti
  db.py              guarda el historial en Supabase
frontend/src/
  pages/             Chat, Voz, Gramática
  components/        Layout, ChatPanel
  lib/               api, speech (micrófono y voz), languages
supabase/schema.sql  tabla messages
```

## Notas

- **Voz:** usa la Web Speech API del navegador. Funciona mejor en Chrome y Edge; en Safari el reconocimiento es limitado. La primera vez, el navegador pedirá permiso para el micrófono.
- **Modelo:** por defecto `gemini-2.5-flash`. Si Google lo cambia o quieres otro, edita `GEMINI_MODEL` en `backend/.env`.
- **Plan gratis de Gemini:** tiene límites de peticiones por minuto y por día que Google puede modificar; si ves errores 429, espera un poco.
- **Añadir temas de gramática:** edita `backend/app/data/grammar.json`; la IA genera la explicación y los ejercicios a partir del `focus` que tú escribas.
- **Añadir un idioma:** agrégalo en `backend/app/prompts.py` (LANGUAGES), en `grammar.json` y en `frontend/src/lib/languages.ts`.
