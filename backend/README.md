# DRD GM Backend

Minimal RAG + LLM API for the **Play** tab (LLM Game Master). Supports OpenAI, Grok (xAI), or an open-source–compatible endpoint (Ollama, vLLM) via `LLM_PROVIDER`.

## Setup

1. **Python 3.10+**
2. From project root:
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   ```
3. Edit `.env`:
   - **OpenAI (default)**: set **`OPENAI_API_KEY`** (required for `/chat` and for RAG embeddings). Optionally `OPENAI_MODEL` (default `gpt-4o-mini`).
   - **Grok (xAI)**: set `LLM_PROVIDER=grok`, **`XAI_API_KEY`** (get one at [console.x.ai](https://console.x.ai)), and optionally `LLM_MODEL` (default `grok-4-1-fast-non-reasoning`). RAG still uses `OPENAI_API_KEY` for embeddings.
   - **Ollama / open-source**: set `LLM_PROVIDER=ollama` (or `openai_compatible`), `LLM_BASE_URL=http://localhost:11434`, and **`LLM_MODEL`** (e.g. `llama3.2`, `mistral`). RAG still uses OpenAI embeddings unless you switch to local embeddings (see below).
   - Optional: `LOG_GM_RESPONSES=true` to log a hash and prefix of each GM reply for bias/canon auditing (no PII).

## Using Grok (xAI)

Set `LLM_PROVIDER=grok` and **`XAI_API_KEY`** in `.env` (get a key at [console.x.ai](https://console.x.ai)). Optionally set `LLM_MODEL` to e.g. `grok-4-1-fast-reasoning`, `grok-4`, etc. The xAI API is OpenAI-compatible at `https://api.x.ai/v1`. RAG embeddings still use `OPENAI_API_KEY` (OpenAI).

## Using Ollama

To use **Ollama** for GM completions, set `LLM_PROVIDER=ollama`, `LLM_MODEL=deepseek-r1` (or e.g. `mistral`). RAG embeddings still use OpenAI; only the chat LLM runs locally.

**Why deepseek-r1:** The debiasing/fine-tuning plan recommended **DeepSeek-V3.2 distilled** (32B/8B) as best for neutrality, low bias, and complex rules. On Ollama that line is **deepseek-r1**: default 8B (~5.2GB), or `deepseek-r1:32b` (~20GB) if you have the VRAM. Alternatives: `mistral`, `llama3.2`, `qwen2.5`.

1. **Install Ollama**: [https://ollama.com](https://ollama.com) — download and install for your OS. On Windows, Ollama runs in the background after install.
2. **Pull the model** (one-time):
   ```bash
   ollama pull deepseek-r1
   ```
   For more capacity (if you have ~20GB VRAM): `ollama pull deepseek-r1:32b` and set `LLM_MODEL=deepseek-r1:32b` in `.env`.
3. Start the backend (see **Run** below). The Play tab will use the local model.

If Ollama is not installed or not running, you’ll get a connection error; start Ollama or set `LLM_PROVIDER=openai` and ensure `OPENAI_API_KEY` is set to fall back to OpenAI.

## RAG source

- Auto-detected: under `reference/` we look for a folder whose name contains `TTRPG` and has a `systeme_drd` subfolder (handles encoding variants like "Récits" vs "Rcits").
- Ensure that path exists and contains `.md` files. The index is built on first `/chat` (or when missing).
- **Rebuild index after adding or changing any `.md` in `systeme_drd`**: either (1) delete the `backend/faiss_drd` folder, or (2) set `RAG_FORCE_REBUILD=1` (or `true`/`yes`) in `.env` and restart the backend — the index will be rebuilt on the next `/chat` (one-time per process when using `RAG_FORCE_REBUILD`).
- Optional: set `FAISS_PATH` (default `./faiss_drd`), `RAG_TOP_K` (default 8), `RAG_FORCE_REBUILD`, and `RAG_SOURCE_DIR` in `.env` to override; we currently use auto-detection for the source dir.

## Run

From project root:

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or from `backend/`:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

(`python -m uvicorn` avoids PATH issues if the uvicorn script isn't installed on PATH.)

**Open in browser:** use **http://localhost:8000** or **http://127.0.0.1:8000** — not `http://0.0.0.0:8000` (that's the bind address; browsers can't connect to it).

- **GET /health** — liveness.
- **POST /chat** — body `{ "messages": [...], "characterSnapshot": {...}, "gameState": {...} }`; returns `{ "reply": "..." }`.
- **POST /chat/stream** — same body; streams GM reply as Server-Sent Events (`data: {"delta": "..."}` or `{"done": true}` or `{"error": "..."}`).

## CORS (Play tab)

By default we use **`allow_origins=["*"]`** for local dev (`CORS_WILDCARD=true`), so the Play tab at **http://localhost:5173** (or 127.0.0.1:5173) can call the API without extra config. Set `CORS_WILDCARD=false` in `.env` to use `CORS_ORIGINS` instead (e.g. for production).

## Frontend

Point the Play tab at this API via `window.GM_API_URL` (default `http://localhost:8000`). Run the site with `npm run dev` from the **project root** (not `backend/`), then open the Play tab.

## Will it work for visitors on your website?

**It depends where the backend and Ollama run.**

- **Backend + Ollama on your PC (localhost):** Only **you** can use the GM. The frontend calls `http://localhost:8000`; visitors loading your site in their browser would try to call *their* localhost, not yours, so the GM would not work for them.
- **Backend + Ollama on a server:** If you deploy the **backend** (and Ollama) on a **server** (e.g. a VPS) and the **frontend** calls that server’s URL, then **everyone** visiting your website can use the GM. The server runs Ollama; your backend talks to it; visitors’ browsers talk to your backend.

So: **for a public website, run the backend (and Ollama) on a server**, and point the frontend at that backend URL (see **Public deployment** below).

## Public deployment (so visitors can use the GM)

1. **Server:** Use a machine that can run Ollama (e.g. a VPS with Ubuntu, enough RAM/GPU for your model). Install Ollama, pull the model (`ollama pull deepseek-r1`), and run the backend there (e.g. with `uvicorn` behind a reverse proxy and HTTPS).
2. **Backend URL:** The backend must be reachable at a public URL (e.g. `https://api.yoursite.com` or `https://yoursite.com/api`).
3. **Frontend:** The Play tab must call that URL. Set it in `index.html` with a meta tag so the built site uses your backend:
   ```html
   <meta name="gm-api-url" content="https://api.yoursite.com"/>
   ```
   The script `gm-chat.js` reads this and uses it instead of `http://localhost:8000`. If you use a build step (e.g. Vite), you can inject this URL from an env var.
4. **CORS:** On the server, set `CORS_ORIGINS` in `.env` to your website’s origin(s) (e.g. `https://yoursite.com`) and `CORS_WILDCARD=false`, so the browser allows requests from your domain.
5. **RAG:** The server needs the `reference/.../systeme_drd` (and optionally `book_extracted`) files and `FAISS_PATH` so the backend can build/load the index. RAG embeddings still use `OPENAI_API_KEY` unless you switch to local embeddings.

**Alternative:** If you don’t want to run Ollama on a server (e.g. no GPU, or you prefer not to maintain it), use **OpenAI** for the public site: set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` on the server. Then deploy the backend anywhere (e.g. a serverless or small VPS) and point the frontend at it; no Ollama on the server.

## Deployment (open-source / fine-tuned model)

- Run your model via **Ollama** (`ollama run your-model`) or an **OpenAI-compatible** server (e.g. vLLM). Set `LLM_PROVIDER=ollama`, `LLM_BASE_URL=http://localhost:11434`, `LLM_MODEL=your-model-name`. The backend uses the same `/chat` and `/chat/stream` API; no frontend changes.
- RAG continues to use your rulebook chunks; the system prompt instructs the model to base responses solely on retrieved content. If you later move fully off OpenAI, you can replace OpenAI embeddings in `rag.py` with a local model (e.g. `sentence-transformers`) and re-build the FAISS index.

## Troubleshooting

- **500 OPENAI_API_KEY not set**: Required when LLM_PROVIDER=openai. For Grok, set LLM_PROVIDER=grok and XAI_API_KEY (console.x.ai). For Ollama, set LLM_PROVIDER=ollama and LLM_MODEL=... instead.
- **500 XAI_API_KEY is required when LLM_PROVIDER=grok**: Get a key at [console.x.ai](https://console.x.ai) and set it in `.env`.
- **500 LLM_MODEL required**: When LLM_PROVIDER is ollama or openai_compatible, set LLM_MODEL to your local model name (e.g. deepseek-r1, mistral, llama3.2).
- **Connection refused to localhost:11434**: Ollama is not running. Install from [ollama.com](https://ollama.com), start it, and run `ollama pull deepseek-r1` (or your chosen model).
- **CORS / "No Access-Control-Allow-Origin"**: We return JSON errors with CORS headers. Restart the backend after config changes. Ensure `CORS_WILDCARD=true` (default) or that your frontend origin is in `CORS_ORIGINS`.
- **500 "You exceeded your current quota" (429 / insufficient_quota)**: The FAISS index uses OpenAI embeddings. Check [OpenAI usage and billing](https://platform.openai.com/usage); add payment method or use a key with quota. The Play tab will show this error once CORS is fixed.
