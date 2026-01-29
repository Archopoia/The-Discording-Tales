"""
Load rulebook/lore from System_Summary, AllBookPages-FullBook, and AllBookTables-csv
into a cleaned corpus (JSONL) for training data prep.
Output: one JSONL file with { "source": str, "section": str, "content": str } per line.
Run from project root: python training/load_corpus.py [--system-summary-dir PATH] [--book-dir PATH] [--csv-dir PATH] [--out PATH]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from tools.drd_sources import (
    default_source_dirs,
    load_md_chunks,
    load_csv_chunks,
)

_BOOK_SKIP_NAMES = {"00_INDEX.md", "00_FULL_BOOK.md"}


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Load DRD rulebook/lore from System_Summary, AllBookPages, AllBookTables into corpus JSONL."
    )
    ap.add_argument(
        "--system-summary-dir",
        type=Path,
        default=None,
        help="Path to System_Summary (default: from reference/.../TTRPG)",
    )
    ap.add_argument(
        "--book-dir",
        type=Path,
        default=None,
        help="Path to AllBookPages-FullBook (default: from reference/.../TTRPG)",
    )
    ap.add_argument(
        "--csv-dir",
        type=Path,
        default=None,
        help="Path to AllBookTables-csv (default: from reference/.../TTRPG)",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("training/corpus.jsonl"),
        help="Output JSONL path (default: training/corpus.jsonl)",
    )
    args = ap.parse_args()

    project = _project_root
    default_ss, default_ab, default_cv = default_source_dirs()

    def resolve(d: Path | None, default: Path) -> Path:
        p = d or default
        if not p.is_absolute():
            p = (project / p).resolve()
        return p

    ss_dir = resolve(args.system_summary_dir, default_ss)
    ab_dir = resolve(args.book_dir, default_ab)
    cv_dir = resolve(args.csv_dir, default_cv)

    all_rows: list[dict] = []

    if ss_dir.is_dir():
        rows = load_md_chunks(ss_dir, chunk_by_h2=True, fallback_full_page=False)
        all_rows.extend(rows)
        print(f"Loaded {len(rows)} chunks from {ss_dir}")
    else:
        print(f"Warning: System_Summary dir not found: {ss_dir}")

    if ab_dir.is_dir():
        rows = load_md_chunks(
            ab_dir,
            chunk_by_h2=True,
            fallback_full_page=True,
            skip_names=_BOOK_SKIP_NAMES,
        )
        all_rows.extend(rows)
        print(f"Loaded {len(rows)} chunks from {ab_dir}")
    else:
        print(f"Warning: AllBookPages dir not found: {ab_dir}")

    if cv_dir.is_dir():
        rows = load_csv_chunks(cv_dir)
        all_rows.extend(rows)
        print(f"Loaded {len(rows)} chunks from {cv_dir}")
    else:
        print(f"Warning: AllBookTables dir not found: {cv_dir}")

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
