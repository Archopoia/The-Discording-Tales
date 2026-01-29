"""
Shared source-loading for DRD RAG and training.
Loads MD (chunked by ## or full page) and CSV (one chunk per file, as markdown table).
"""
from __future__ import annotations

import csv
import re
from pathlib import Path


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def default_source_dirs() -> tuple[Path, Path, Path]:
    """Return (System_Summary, AllBookPages-FullBook, AllBookTables-csv) under TTRPG folder."""
    ref = _project_root() / "reference"
    for sub in ref.iterdir():
        if not sub.is_dir() or "TTRPG" not in sub.name:
            continue
        base = sub
        ss = base / "System_Summary"
        ab = base / "AllBookPages-FullBook"
        cv = base / "AllBookTables-csv"
        return (ss, ab, cv)
    base = ref / "TTRPG_DRD"
    return (
        base / "System_Summary",
        base / "AllBookPages-FullBook",
        base / "AllBookTables-csv",
    )


def load_md_chunks(
    dir_path: Path,
    *,
    chunk_by_h2: bool = True,
    fallback_full_page: bool = False,
    skip_names: set[str] | None = None,
) -> list[dict]:
    """
    Load all .md under dir_path, optionally split by ##.
    Returns list of {"source": str, "section": str, "content": str}.
    """
    skip_names = skip_names or set()
    rows: list[dict] = []
    dir_path = Path(dir_path)
    if not dir_path.is_dir():
        return rows

    for fp in sorted(dir_path.glob("**/*.md")):
        if fp.name in skip_names:
            continue
        try:
            text = fp.read_text(encoding="utf-8")
        except Exception:
            continue
        name = fp.name
        parts = re.split(r"(?=^##\s+)", text, flags=re.MULTILINE) if chunk_by_h2 else [text]
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


def _csv_to_markdown_table(fp: Path, max_chars: int = 12_000) -> str:
    """Read CSV and return a markdown table string. Truncate if over max_chars."""
    rows: list[list[str]] = []
    for enc in ("utf-8-sig", "utf-8"):
        try:
            with open(fp, encoding=enc, newline="") as f:
                reader = csv.reader(f)
                for r in reader:
                    rows.append([str(c).strip() for c in r])
            break
        except Exception:
            continue
    else:
        return ""

    if not rows:
        return ""
    ncols = max(len(r) for r in rows)
    for r in rows:
        while len(r) < ncols:
            r.append("")
    lines: list[str] = []
    for i, r in enumerate(rows):
        line = "| " + " | ".join(_escape_cell(c) for c in r) + " |"
        lines.append(line)
        if i == 0:
            lines.append("| " + " | ".join("---" for _ in r) + " |")
    out = "\n".join(lines)
    if len(out) > max_chars:
        out = out[: max_chars - 80] + "\n\n[... table truncated ...]"
    return out


def _escape_cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\n", " ")


def load_csv_chunks(dir_path: Path, max_chars: int = 12_000) -> list[dict]:
    """
    Load all .csv under dir_path. One chunk per file; content = markdown table.
    Returns list of {"source": str, "section": str, "content": str}.
    """
    chunks: list[dict] = []
    dir_path = Path(dir_path)
    if not dir_path.is_dir():
        return chunks

    for fp in sorted(dir_path.glob("**/*.csv")):
        table = _csv_to_markdown_table(fp, max_chars=max_chars)
        if not table:
            continue
        name = fp.name
        section = "table"
        chunks.append({"source": name, "section": section, "content": table})
    return chunks
