# Training data and fine-tuning for DRD GM

This directory holds scripts to prepare instruction/Q&A data from the Des Récits Discordants rulebook and lore, and documentation for fine-tuning an open-source base model (LoRA) so the GM stays faithful to your IP and impartial.

## Phase 2: Data preparation

### 1. Build corpus (rulebook chunks)

From the project root:

```bash
python training/load_corpus.py --out training/corpus.jsonl
```

Optional: include the full book extracted pages:

```bash
python training/load_corpus.py --book-dir --out training/corpus.jsonl
```

Output: `training/corpus.jsonl` — one JSON object per line: `{"source": "filename.md", "section": "Section title", "content": "..."}`.

### 2. Generate Q&A dataset

**Template mode** (no API; you fill completions later or use another tool):

```bash
python training/generate_qa_dataset.py --corpus training/corpus.jsonl --out training/train.jsonl --mode template
```

**LLM mode** (uses OpenAI or `OPENAI_BASE_URL` to generate 5–20 pairs per chunk):

```bash
set OPENAI_API_KEY=sk-...
python training/generate_qa_dataset.py --corpus training/corpus.jsonl --out training/train.jsonl --mode llm --max-per-chunk 15
```

**With debiasing subset** (adds morally gray / impartial GM examples):

```bash
python training/generate_qa_dataset.py --corpus training/corpus.jsonl --out training/train.jsonl --mode template --debiasing --debiasing-out training/debiasing.jsonl
```

Output format: JSONL where each line is a chat-style example for fine-tuning:

```json
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

**Combined dataset:** Use `training/train_combined.jsonl` for fine-tuning — it merges `train.jsonl` (instruction examples) and `debiasing.jsonl` (impartial GM on morally gray scenarios). Regenerate it after changing either file:

```bash
python -c "
from pathlib import Path
p = Path('training')
with open(p / 'train_combined.jsonl', 'w', encoding='utf-8') as out:
    for f in ['train.jsonl', 'debiasing.jsonl']:
        with open(p / f, 'r', encoding='utf-8') as inp:
            for line in inp:
                if line.strip(): out.write(line)
"
```

Target: 1,000–5,000 high-quality pairs (template mode gives ~287+287; use `--mode llm` for more).

## Phase 3: Fine-tuning (see below)

See **Fine-tuning** in this README for base model choice, LoRA/QLoRA with Unsloth or LLaMA-Factory, and how to export/serve the model (Ollama, vLLM).

## Fine-tuning

### Base model

- **Recommended**: DeepSeek-V3.2 distilled (32B/8B) — neutral, good for rules; fine-tunable on one GPU or Colab. Download from Hugging Face.
- **Alternatives**: Qwen3 (smaller variants), Llama 4 Maverick/Scout, Mistral Medium 3 / Ministral 14B. All open weights, suitable for RPG GM and debiasing.

### Stack (beginner-friendly)

1. **Unsloth** (fast, memory-efficient): Install Unsloth, load base model, load your JSONL (chat format above), run LoRA/QLoRA training, export adapter or merged model for Ollama/vLLM.
2. **LLaMA-Factory** (no-code UI): Use the web UI to upload your dataset, select base model, run LoRA training; export for Ollama or vLLM.
3. **Hugging Face PEFT**: Load base model + tokenizer, load JSONL as `Dataset`, train with `LoraConfig` and `Trainer`, save adapter.

Training time: about 1–2 hours on a free Colab GPU for a few thousand examples.

### Training config

- Train **only** on your prepared data (instruction + debiasing). No external datasets.
- Each example should include the short system prompt (impartial Éveilleur, only provided rules/lore, no refusals) so the model learns it.
- Chat format: `[system, user, assistant]` per example, as produced by `generate_qa_dataset.py`.

### Export and serve

- **Ollama**: Import merged model or use Ollama’s fine-tuning flow; run `ollama run your-model-name`. Point the backend at `LLM_PROVIDER=ollama`, `LLM_BASE_URL=http://localhost:11434`, `LLM_MODEL=your-model-name`.
- **vLLM**: Serve the model (with LoRA adapters if needed) and use the OpenAI-compatible endpoint; set `LLM_PROVIDER=openai_compatible`, `LLM_BASE_URL=http://your-vllm-host:8000/v1`, `LLM_MODEL=your-model`.

After training, configure the backend (see [backend/README.md](../backend/README.md)) and run playtests; use `LOG_GM_RESPONSES=true` to audit outputs and add problematic cases to the dataset for the next training run.
