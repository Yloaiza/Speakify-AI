from abc import ABC, abstractmethod
from typing import AsyncIterator


class LLMProvider(ABC):
    """Interfaz comun. Para cambiar de proveedor (Groq, Ollama...) solo
    creas otra clase que implemente estos metodos."""

    @abstractmethod
    def stream(self, system: str, messages: list[dict]) -> AsyncIterator[str]:
        """Devuelve la respuesta por trozos de texto."""

    @abstractmethod
    async def generate(
        self, system: str, messages: list[dict], json_mode: bool = False
    ) -> str:
        """Devuelve la respuesta completa."""

    @abstractmethod
    async def transcribe(self, audio: bytes, mime_type: str, language_name: str) -> str:
        """Convierte audio a texto, sin corregir los errores del estudiante."""
