"""
LLM provider abstraction for DRD GM backend.
Supports: openai, grok (xAI), ollama, openai_compatible (e.g. vLLM).
"""
import os
from typing import Any

from openai import OpenAI


def create_client(
    provider: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    model: str | None = None,
) -> tuple[OpenAI, str]:
    """
    Create an OpenAI-compatible client and the model name to use.
    Returns (client, model_name).
    - openai: uses OPENAI_API_KEY, OPENAI_MODEL; base_url default.
    - grok: xAI Grok at https://api.x.ai/v1; uses XAI_API_KEY, LLM_MODEL.
    - ollama: base_url typically http://localhost:11434/v1, model e.g. llama3.2.
    - openai_compatible: same as ollama but for any OpenAI-compatible server (vLLM, etc.).
    """
    provider = (provider or os.getenv("LLM_PROVIDER", "openai")).strip().lower()
    base_url = base_url or os.getenv("LLM_BASE_URL", "").strip()
    model = model or os.getenv("LLM_MODEL", "").strip()

    if provider == "openai":
        key = api_key or os.getenv("OPENAI_API_KEY", "")
        if not key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        m = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return OpenAI(api_key=key), m

    if provider == "grok":
        key = api_key or os.getenv("XAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")
        if not key:
            raise ValueError("XAI_API_KEY is required when LLM_PROVIDER=grok (get one at console.x.ai)")
        url = base_url or "https://api.x.ai/v1"
        if not url.endswith("/v1") and "/v1" not in url:
            url = url.rstrip("/") + "/v1"
        m = model or os.getenv("LLM_MODEL", "grok-4-1-fast-non-reasoning")
        return OpenAI(base_url=url, api_key=key), m

    if provider in ("ollama", "openai_compatible"):
        url = base_url or "http://localhost:11434/v1"
        if not url.endswith("/v1") and "/v1" not in url:
            url = url.rstrip("/") + "/v1"
        if not model:
            raise ValueError("LLM_MODEL is required when using ollama or openai_compatible")
        # OpenAI client with base_url works with Ollama and vLLM
        return OpenAI(base_url=url, api_key=os.getenv("OPENAI_API_KEY") or "ollama"), model

    raise ValueError(f"Unknown LLM_PROVIDER: {provider}. Use openai, grok, ollama, or openai_compatible.")


def chat_completion(
    client: OpenAI,
    model: str,
    messages: list[dict[str, str]],
    max_tokens: int = 1024,
    stream: bool = False,
    temperature: float | None = None,
    top_p: float | None = None,
) -> Any:
    """
    Call chat completions. Returns either the full response (stream=False)
    or the stream iterator (stream=True).
    Use temperature=0.2–0.4 for RAG/rulebook grounding to reduce hallucination.
    """
    kwargs = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "stream": stream,
    }
    if temperature is not None:
        kwargs["temperature"] = temperature
    if top_p is not None:
        kwargs["top_p"] = top_p
    return client.chat.completions.create(**kwargs)
