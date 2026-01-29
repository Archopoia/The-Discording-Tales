"""
Generate instruction/Q&A dataset (and optional debiasing subset) from corpus JSONL.
Output: JSONL in chat format for fine-tuning: {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}.

Modes:
  template  - For each corpus chunk, write one template row (user prompt with rules; assistant empty or placeholder). You can fill completions manually or run with --llm later.
  llm       - Call OpenAI (or OPENAI_BASE_URL) to generate 5--20 prompt/completion pairs per chunk. Requires OPENAI_API_KEY (or base URL for compatible API).

Optional: --debiasing adds 200--500 morally-gray scenario templates (or LLM-generated) with "impartial, in-world only" instruction.

Run from project root:
  python training/generate_qa_dataset.py --corpus training/corpus.jsonl --out training/train.jsonl [--mode template|llm] [--debiasing] [--max-per-chunk 20]
"""
from __future__ import annotations

import argparse
import json
import os
import random
import sys
from pathlib import Path

# Optional OpenAI for LLM mode
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

SYSTEM_PROMPT_SHORT = """You are the Éveilleur (GM) for Des Récits Discordants. Use ONLY the rules and lore provided. Never invent mechanics. Adjudicate every in-fiction action; never refuse. Respond in the setting's voice without external moral commentary. When a roll is needed, output exactly: Roll [Compétence] vs Niv +X."""


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_corpus(path: Path) -> list[dict]:
    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def template_row(source: str, section: str, content: str, *, debiasing: bool = False) -> dict:
    """One training example in chat format (assistant content placeholder)."""
    if debiasing:
        user = (
            "A player describes an in-fiction action that is morally dark or violent (e.g. betrayal, cruelty, mature themes). "
            "As impartial GM using ONLY the rules and lore below, adjudicate the action: describe the scene and consequences in the setting's voice. "
            "Do not refuse, apologise, or add real-world moral judgment. Apply rules and portray in-world consequences only.\n\n"
            f"[Rules/lore]\n{content[:4000]}"
        )
    else:
        user = (
            "Player asks something about the rules or describes an action. As impartial GM using ONLY these rules/lore, respond accurately without external bias. "
            "If a roll is needed, output exactly one line: Roll [Compétence] vs Niv +X.\n\n"
            f"[Rules/lore — {source} — {section}]\n{content[:4000]}"
        )
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_SHORT},
            {"role": "user", "content": user},
            {"role": "assistant", "content": ""},
        ]
    }


def generate_with_llm(
    content: str,
    source: str,
    section: str,
    *,
    client: OpenAI,
    model: str,
    max_pairs: int = 15,
    debiasing: bool = False,
) -> list[dict]:
    """Use LLM to generate multiple prompt/completion pairs for one chunk."""
    if OpenAI is None:
        raise RuntimeError("openai package required for --mode llm; pip install openai")

    if debiasing:
        sys_prompt = (
            "You generate training examples for an impartial TTRPG GM. For each example, output a JSON object with two keys: 'user' and 'assistant'. "
            "User = a short player message describing a morally dark or violent in-fiction action (betrayal, cruelty, mature themes). "
            "Assistant = the GM response: adjudicate in the setting's voice, no refusal or moral commentary, apply rules and in-world consequences only. "
            "Generate 5--10 such examples. Output one JSON object per line (no markdown, no array wrapper)."
        )
        chunk_preview = content[:2500]
    else:
        sys_prompt = (
            "You generate training examples for a TTRPG GM. Given the rules/lore excerpt below, produce 5--20 prompt/completion pairs. "
            "Each pair: 'user' = a short player question or action (in French or English); 'assistant' = GM reply using ONLY the given rules, in-world voice, and when a roll is needed use exactly: Roll [Compétence] vs Niv +X. "
            "Output one JSON object per line with keys 'user' and 'assistant' (no markdown, no array wrapper)."
        )
        chunk_preview = f"[{source} — {section}]\n{content[:3500]}"

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": f"Rules/lore excerpt:\n\n{chunk_preview}\n\nGenerate the examples, one JSON per line."},
    ]
    try:
        r = client.chat.completions.create(model=model, messages=messages, max_tokens=4096)
        text = (r.choices[0].message.content or "").strip()
    except Exception as e:
        print(f"LLM error for {source} {section}: {e}", file=sys.stderr)
        return []

    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("```"):
            continue
        try:
            obj = json.loads(line)
            u = obj.get("user") or obj.get("prompt", "")
            a = obj.get("assistant") or obj.get("completion", "")
            if u and a:
                out.append({
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT_SHORT},
                        {"role": "user", "content": u},
                        {"role": "assistant", "content": a},
                    ]
                })
        except json.JSONDecodeError:
            continue
        if len(out) >= max_pairs:
            break
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate Q&A dataset from corpus JSONL.")
    ap.add_argument("--corpus", type=Path, default=Path("training/corpus.jsonl"), help="Input corpus JSONL")
    ap.add_argument("--out", type=Path, default=Path("training/train.jsonl"), help="Output train JSONL")
    ap.add_argument("--debiasing-out", type=Path, default=None, help="Optional: separate file for debiasing examples")
    ap.add_argument("--mode", choices=["template", "llm"], default="template", help="template = placeholder; llm = call API to generate pairs")
    ap.add_argument("--debiasing", action="store_true", help="Add debiasing subset (morally gray scenarios)")
    ap.add_argument("--debiasing-count", type=int, default=300, help="Target number of debiasing examples (default 300)")
    ap.add_argument("--max-per-chunk", type=int, default=20, help="Max pairs per chunk in llm mode (default 20)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed for sampling")
    args = ap.parse_args()

    project = _project_root()
    corpus_path = args.corpus if args.corpus.is_absolute() else project / args.corpus
    if not corpus_path.is_file():
        print(f"Corpus not found: {corpus_path}. Run training/load_corpus.py first.", file=sys.stderr)
        sys.exit(1)

    corpus = load_corpus(corpus_path)
    print(f"Loaded {len(corpus)} chunks from {corpus_path}")

    examples: list[dict] = []
    client = None
    model = "gpt-4o-mini"
    if args.mode == "template":
        for row in corpus:
            examples.append(template_row(row["source"], row["section"], row["content"], debiasing=False))
    else:
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = (os.getenv("OPENAI_BASE_URL") or "").strip()
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        if not api_key and not base_url:
            print("For --mode llm set OPENAI_API_KEY or OPENAI_BASE_URL.", file=sys.stderr)
            sys.exit(1)
        client = OpenAI(api_key=api_key or "dummy", base_url=base_url or None)
        for i, row in enumerate(corpus):
            pairs = generate_with_llm(
                row["content"],
                row["source"],
                row["section"],
                client=client,
                model=model,
                max_pairs=args.max_per_chunk,
                debiasing=False,
            )
            examples.extend(pairs)
            if (i + 1) % 10 == 0:
                print(f"Generated for {i + 1}/{len(corpus)} chunks, total examples so far: {len(examples)}")

    out_path = args.out if args.out.is_absolute() else project / args.out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
    print(f"Wrote {len(examples)} examples to {out_path}")

    debiasing_examples: list[dict] = []
    if args.debiasing:
        if args.mode == "template":
            # Sample chunks and add debiasing template rows
            rng = random.Random(args.seed)
            sample = rng.sample(corpus, min(len(corpus), args.debiasing_count))
            for row in sample:
                debiasing_examples.append(template_row(row["source"], row["section"], row["content"], debiasing=True))
        else:
            if client is None:
                api_key = os.getenv("OPENAI_API_KEY")
                base_url = (os.getenv("OPENAI_BASE_URL") or "").strip()
                model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                client = OpenAI(api_key=api_key or "dummy", base_url=base_url or None)
            rng = random.Random(args.seed)
            sample = rng.sample(corpus, min(len(corpus), max(1, args.debiasing_count // 10)))
            for row in sample:
                pairs = generate_with_llm(
                    row["content"],
                    row["source"],
                    row["section"],
                    client=client,
                    model=model,
                    max_pairs=min(15, args.debiasing_count // len(sample)),
                    debiasing=True,
                )
                debiasing_examples.extend(pairs)

        deb_path = args.debiasing_out or (out_path.parent / "debiasing.jsonl")
        if not deb_path.is_absolute():
            deb_path = project / deb_path
        deb_path.parent.mkdir(parents=True, exist_ok=True)
        with open(deb_path, "w", encoding="utf-8") as f:
            for ex in debiasing_examples:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")
        print(f"Wrote {len(debiasing_examples)} debiasing examples to {deb_path}")


if __name__ == "__main__":
    main()
