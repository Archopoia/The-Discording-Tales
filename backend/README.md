# DRD GM Backend

Minimal RAG + LLM API for the **Play** tab (LLM Game Master).

## Setup

1. **Python 3.10+**
2. From project root:
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   ```
3. Edit `.env`: set **`OPENAI_API_KEY`** to a valid key (required for `/chat` and RAG embeddings). Optionally `OPENAI_MODEL`, `FAISS_PATH`, `CORS_ORIGINS`.

## RAG source

- Auto-detected: under `reference/` we look for a folder whose name contains `TTRPG` and has a `systeme_drd` subfolder (handles encoding variants like "Récits" vs "Rcits").
- Ensure that path exists and contains `.md` files. The index is built on first `/chat` (or when missing).
- Optional: set `FAISS_PATH` (default `./faiss_drd`) and `RAG_SOURCE_DIR` in `.env` to override; we currently use auto-detection for the source dir.

## Run

From project root:

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or from `backend/`:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

(`python -m uvicorn` avoids PATH issues if the uvicorn script isn’t installed on PATH.)

**Open in browser:** use **http://localhost:8000** or **http://127.0.0.1:8000** — not `http://0.0.0.0:8000` (that’s the bind address; browsers can’t connect to it).

- **GET /health** — liveness.
- **POST /chat** — body `{ "messages": [...], "characterSnapshot": {...} }`; returns `{ "reply": "..." }`.

## CORS (Play tab)

By default we use **`allow_origins=["*"]`** for local dev (`CORS_WILDCARD=true`), so the Play tab at **http://localhost:5173** (or 127.0.0.1:5173) can call the API without extra config. Set `CORS_WILDCARD=false` in `.env` to use `CORS_ORIGINS` instead (e.g. for production).

## Frontend

Point the Play tab at this API via `window.GM_API_URL` (default `http://localhost:8000`). Run the site with `npm run dev` from the **project root** (not `backend/`), then open the Play tab.

## Troubleshooting

- **CORS / “No Access-Control-Allow-Origin”**: We return JSON errors with CORS headers. Restart the backend after config changes. Ensure `CORS_WILDCARD=true` (default) or that your frontend origin is in `CORS_ORIGINS`.
- **500 “You exceeded your current quota” (429 / insufficient_quota)**: The FAISS index uses OpenAI embeddings. Check [OpenAI usage and billing](https://platform.openai.com/usage); add payment method or use a key with quota. The Play tab will show this error once CORS is fixed.
