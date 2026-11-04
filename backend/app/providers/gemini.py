import asyncio
from typing import AsyncIterator

from google import genai
from google.genai import errors, types

from .base import LLMProvider

# Errores temporales de Google: vale la pena reintentar.
RETRYABLE_CODES = {429, 500, 503}
ATTEMPTS_PER_MODEL = 3


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = genai.Client(api_key=api_key)
        # GEMINI_MODEL admite varios modelos separados por coma:
        # el primero es el principal y los demas son respaldo.
        self.models = [m.strip() for m in model.split(",") if m.strip()]

    @property
    def _attempts(self) -> int:
        # Con varios modelos pasamos al siguiente de inmediato; con uno solo, reintentamos.
        return 1 if len(self.models) > 1 else ATTEMPTS_PER_MODEL

    @staticmethod
    def _contents(messages: list[dict]) -> list[types.Content]:
        return [
            types.Content(
                role="user" if m["role"] == "user" else "model",
                parts=[types.Part.from_text(text=m["content"])],
            )
            for m in messages
        ]

    @staticmethod
    def _config_for(model: str, **kwargs) -> types.GenerateContentConfig:
        """Gemini 2.5 Flash "piensa" por defecto antes de responder, lo que suma
        varios segundos. Para un tutor conversacional y para transcribir no hace falta."""
        if "2.5-flash" in model:
            kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
        return types.GenerateContentConfig(**kwargs)

    @staticmethod
    def _is_retryable(exc: Exception) -> bool:
        return isinstance(exc, errors.APIError) and getattr(exc, "code", None) in RETRYABLE_CODES

    async def stream(self, system: str, messages: list[dict]) -> AsyncIterator[str]:
        last_exc: Exception | None = None
        for model in self.models:
            config = self._config_for(model, system_instruction=system, temperature=0.7)
            for attempt in range(self._attempts):
                started = False
                try:
                    response = await self.client.aio.models.generate_content_stream(
                        model=model,
                        contents=self._contents(messages),
                        config=config,
                    )
                    async for chunk in response:
                        if chunk.text:
                            started = True
                            yield chunk.text
                    if model != self.models[0]:
                        print(f"[gemini] respondio el modelo de respaldo: {model}")
                    return
                except Exception as exc:
                    last_exc = exc
                    # Si ya enviamos texto o el error no es temporal, no reintentamos.
                    if started or not self._is_retryable(exc):
                        raise
                    print(f"[gemini] {model} intento {attempt + 1} fallo: {exc}")
                    if attempt < self._attempts - 1:
                        await asyncio.sleep(1.5 * (attempt + 1))
        raise last_exc  # type: ignore[misc]

    async def _generate_with_fallback(
        self, contents: list[types.Content], **config_kwargs
    ) -> str:
        last_exc: Exception | None = None
        for model in self.models:
            config = self._config_for(model, **config_kwargs)
            for attempt in range(self._attempts):
                try:
                    response = await self.client.aio.models.generate_content(
                        model=model,
                        contents=contents,
                        config=config,
                    )
                    if model != self.models[0]:
                        print(f"[gemini] respondio el modelo de respaldo: {model}")
                    return response.text or ""
                except Exception as exc:
                    last_exc = exc
                    if not self._is_retryable(exc):
                        raise
                    print(f"[gemini] {model} intento {attempt + 1} fallo: {exc}")
                    if attempt < self._attempts - 1:
                        await asyncio.sleep(1.5 * (attempt + 1))
        raise last_exc  # type: ignore[misc]

    async def generate(
        self, system: str, messages: list[dict], json_mode: bool = False
    ) -> str:
        return await self._generate_with_fallback(
            self._contents(messages),
            system_instruction=system,
            temperature=0.7,
            response_mime_type="application/json" if json_mode else None,
        )

    async def transcribe(self, audio: bytes, mime_type: str, language_name: str) -> str:
        prompt = (
            f"Transcribe the speech in this audio. The speaker is a language learner "
            f"practicing {language_name}; they may make grammar or pronunciation mistakes "
            f"and may mix in some Spanish words. Write exactly what was said, in the "
            f"original language and script. Do not translate, correct, summarize or add "
            f"any comment. Return only the transcript. If there is no intelligible speech, "
            f"return an empty string."
        )
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                    types.Part.from_bytes(data=audio, mime_type=mime_type),
                ],
            )
        ]
        return await self._generate_with_fallback(contents, temperature=0)
