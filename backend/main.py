"""
LLM GM backend for Des Récits Discordants: RAG + /chat, /health.
"""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

_load_env = Path(__file__).resolve().parent / ".env"
load_dotenv(_load_env)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from openai import OpenAI

from rag import build_or_get_index, retrieve, format_chunks_for_prompt

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


# Config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:5500")
CORS_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]
# Use * for local dev when no credentials (Play chat doesn't send cookies)
CORS_USE_WILDCARD = os.getenv("CORS_WILDCARD", "true").lower() in ("1", "true", "yes")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "6"))

app = FastAPI(title="DRD GM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if CORS_USE_WILDCARD else CORS_ORIGINS,
    allow_credentials=not CORS_USE_WILDCARD,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers():
    """CORS headers to attach to error responses so 5xx still allow cross-origin fetch."""
    if CORS_USE_WILDCARD:
        return {"Access-Control-Allow-Origin": "*"}
    return {}


@app.exception_handler(HTTPException)
def http_exception_handler(_request: Request, exc: HTTPException):
    """Ensure CORS headers on 4xx/5xx from HTTPException."""
    body = {"detail": exc.detail, "reply": ""}
    r = JSONResponse(status_code=exc.status_code, content=body)
    for k, v in _cors_headers().items():
        r.headers[k] = v
    return r


@app.exception_handler(Exception)
def global_exception_handler(_request: Request, exc: Exception):
    """Catch unhandled exceptions, log, return 500 with CORS so browser can read error."""
    log.exception("Unhandled exception")
    body = {"detail": "Internal server error", "reply": ""}
    try:
        body["detail"] = str(exc)
    except Exception:
        pass
    r = JSONResponse(status_code=500, content=body)
    for k, v in _cors_headers().items():
        r.headers[k] = v
    return r


# Lazy-init RAG vectorstore on first /chat
_vectorstore = None


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = build_or_get_index()
    return _vectorstore


# --- Schemas ---


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    characterSnapshot: dict | None = None


class ChatResponse(BaseModel):
    reply: str


# --- System prompt ---

GM_INSTRUCTIONS = """You are the Éveilleur (GM) for Des Récits Discordants. Use ONLY the rules and lore provided below. Never invent mechanics.

When a roll is needed, say explicitly: "Roll [Compétence] vs Niv ±X." and wait for the player to report the result.

Keep tone and setting consistent with the world (Iäoduneï, Rils, Peoples, etc.).

Step 1: Check rules. Step 2: Apply lore. Step 3: Respond."""


def _format_character_blurb(snap: dict | None) -> str:
    if not snap:
        return ""
    parts = []
    attrs = snap.get("attributes") or {}
    if attrs:
        parts.append("Attributes: " + ", ".join(f"{k}={v}" for k, v in attrs.items()))
    apt = snap.get("aptitudeLevels") or {}
    if apt:
        parts.append("Aptitudes: " + ", ".join(f"{k}={v}" for k, v in apt.items()))
    comp = snap.get("competences") or {}
    revealed = [c for c, d in comp.items() if isinstance(d, dict) and d.get("isRevealed")]
    if revealed:
        parts.append("Revealed competences: " + ", ".join(revealed[:12]))
    souff = snap.get("souffrances") or {}
    ds = [(s, d.get("degreeCount", 0)) for s, d in souff.items() if isinstance(d, dict)]
    ds = [(s, n) for s, n in ds if n > 0]
    if ds:
        parts.append("Souffrances (DS): " + ", ".join(f"{s}={n}" for s, n in ds))
    if not parts:
        return ""
    return "Current character (optional context):\n" + "\n".join(parts) + "\n\n"


# --- Routes ---


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/docs", status_code=302)


@app.get("/health")
def health():
    return {"status": "ok"}


def _error_response(status: int, detail: str) -> JSONResponse:
    """Return JSON error with CORS so browser can read it (avoids FastAPI 0.70+ Exception handler bug)."""
    r = JSONResponse(status_code=status, content={"detail": detail, "reply": ""})
    for k, v in _cors_headers().items():
        r.headers[k] = v
    return r


@app.post("/chat")
def chat(req: ChatRequest):
    if not OPENAI_API_KEY:
        return _error_response(500, "OPENAI_API_KEY not set")

    messages = req.messages
    if not messages:
        return _error_response(400, "messages required")

    last_user = next((m.content for m in reversed(messages) if m.role == "user"), "")
    if not last_user.strip():
        return _error_response(400, "at least one user message required")

    try:
        vs = _get_vectorstore()
        chunks = retrieve(vs, last_user, k=RAG_TOP_K)
        rules_block = format_chunks_for_prompt(chunks)
        char_block = _format_character_blurb(req.characterSnapshot)

        system = f"{GM_INSTRUCTIONS}\n\n---\n\nRules and lore (use only these):\n\n{rules_block}\n\n{char_block}".strip()

        client = OpenAI(api_key=OPENAI_API_KEY)
        openai_messages = [{"role": "system", "content": system}]
        for m in messages:
            openai_messages.append({"role": m.role, "content": m.content})

        r = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=openai_messages,
            max_tokens=1024,
        )
        reply = (r.choices[0].message.content or "").strip()
    except Exception as e:
        log.exception("chat error")
        return _error_response(500, str(e))

    return ChatResponse(reply=reply)
