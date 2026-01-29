"""
Load rulebook/lore MDs into a cleaned corpus (JSONL) for training data prep.
Output: one JSONL file with { "source": str, "section": str, "content": str } per line.
Run from project root: python training/load_corpus.py [--systeme-dir PATH] [--book-dir PATH] [--out PATH]
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _default_systeme_dir() -> Path:
    ref = _project_root() / "reference"
    for sub in ref.iterdir():
        if not sub.is_dir() or "TTRPG" not in sub.name:
            continue
        systeme = sub / "systeme_drd"
        if systeme.is_dir():
            return systeme
    return ref / "TTRPG - Des Récits Discordants" / "systeme_drd"


def _default_book_dir() -> Path | None:
    ref = _project_root() / "reference"
    for sub in ref.iterdir():
        if not sub.is_dir() or "TTRPG" not in sub.name:
            continue
        book = sub / "book_extracted"
        if book.is_dir():
            return book
    return None


def load_and_chunk_mds(source_dir: Path) -> list[dict]:
    """Load all .md under source_dir, split by ##. Return list of {source, section, content}."""
    rows: list[dict] = []
    source_dir = Path(source_dir)
    if not source_dir.is_dir():
        return rows

    for fp in sorted(source_dir.glob("**/*.md")):
        try:
            text = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        name = fp.name
        parts = re.split(r"(?=^##\s+)", text, flags=re.MULTILINE)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            section = "root"
            m = re.match(r"^##\s+(.+?)(?:\n|$)", part)
            if m:
                section = m.group(1).strip()
            rows.append({"source": name, "section": section, "content": part})
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="Load DRD rulebook/lore MDs into corpus JSONL.")
    ap.add_argument(
        "--systeme-dir",
        type=Path,
        default=None,
        help="Path to systeme_drd (default: reference/.../systeme_drd)",
    )
    ap.add_argument(
        "--book-dir",
        type=Path,
        default=None,
        nargs="?",
        const=True,
        help="Include book_extracted; optional path (default: reference/.../book_extracted)",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("training/corpus.jsonl"),
        help="Output JSONL path (default: training/corpus.jsonl)",
    )
    args = ap.parse_args()

    project = _project_root()
    systeme_dir = args.systeme_dir or _default_systeme_dir()
    if not systeme_dir.is_absolute():
        systeme_dir = (project / systeme_dir).resolve()

    all_rows: list[dict] = []
    if systeme_dir.is_dir():
        rows = load_and_chunk_mds(systeme_dir)
        all_rows.extend(rows)
        print(f"Loaded {len(rows)} chunks from {systeme_dir}")
    else:
        print(f"Warning: systeme dir not found: {systeme_dir}")

    if args.book_dir is not None:
        book_dir = args.book_dir if isinstance(args.book_dir, Path) else _default_book_dir()
        if book_dir is None:
            book_dir = project / "reference" / "TTRPG - Des Récits Discordants" / "book_extracted"
        if not book_dir.is_absolute():
            book_dir = (project / book_dir).resolve()
        if book_dir.is_dir():
            rows = load_and_chunk_mds(book_dir)
            all_rows.extend(rows)
            print(f"Loaded {len(rows)} chunks from {book_dir}")
        else:
            print(f"Warning: book dir not found: {book_dir}")

    out = args.out
    if not out.is_absolute():
        out = (project / out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        for row in all_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Wrote {len(all_rows)} chunks to {out}")


if __name__ == "__main__":
    main()
