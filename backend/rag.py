"""
RAG pipeline for Des Récits Discordants: load MDs + CSVs from System_Summary,
AllBookPages-FullBook, AllBookTables-csv; chunk, embed, FAISS, retrieve.
Uses FAISS (no ChromaDB/onnxruntime) for compatibility with Python 3.14 and simpler install.
"""
from pathlib import Path
import os
import sys

# Ensure project root on path for tools.drd_sources
_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

from tools.drd_sources import (
    default_source_dirs,
    load_md_chunks,
    load_csv_chunks,
)


def _default_faiss_path() -> Path:
    return Path(__file__).resolve().parent / "faiss_drd"


_force_rebuild_done = False

# Skip navigation-only book pages when loading AllBookPages
_BOOK_SKIP_NAMES = {"00_INDEX.md", "00_FULL_BOOK.md"}


def _resolve_source_dirs():
    """
    Resolve (System_Summary, AllBookPages-FullBook, AllBookTables-csv).
    If RAG_SOURCE_DIR is set, use it as root containing those three subdirs.
    Otherwise use default_source_dirs() from tools.
    If override root is used but none of the subdirs exist, fall back to defaults.
    """
    override = (os.getenv("RAG_SOURCE_DIR") or "").strip()
    if override:
        root = Path(override)
        if not root.is_absolute():
            root = (_project_root / root).resolve()
        candidates = (
            root / "System_Summary",
            root / "AllBookPages-FullBook",
            root / "AllBookTables-csv",
        )
        if any(p.is_dir() for p in candidates):
            return candidates
    return default_source_dirs()


def _load_all_docs() -> list[Document]:
    """Load chunks from System_Summary, AllBookPages, AllBookTables; return list of Documents."""
    ss_dir, ab_dir, cv_dir = _resolve_source_dirs()
    out: list[Document] = []

    def add(chunks: list[dict]) -> None:
        for c in chunks:
            out.append(
                Document(
                    page_content=c["content"],
                    metadata={"source": c["source"], "section": c["section"]},
                )
            )

    if ss_dir.is_dir():
        chunks = load_md_chunks(ss_dir, chunk_by_h2=True, fallback_full_page=False)
        add(chunks)
    if ab_dir.is_dir():
        chunks = load_md_chunks(
            ab_dir,
            chunk_by_h2=True,
            fallback_full_page=True,
            skip_names=_BOOK_SKIP_NAMES,
        )
        add(chunks)
    if cv_dir.is_dir():
        chunks = load_csv_chunks(cv_dir)
        add(chunks)

    return out


def build_or_get_index(
    faiss_path: Path | None = None,
    embed_model: str = "text-embedding-3-small",
):
    """Build FAISS index from System_Summary + AllBookPages + AllBookTables if missing, else load.
    Set RAG_FORCE_REBUILD=1 (or true/yes) to delete existing index and rebuild."""
    raw_faiss = faiss_path or os.getenv("FAISS_PATH") or _default_faiss_path()
    faiss_path = Path(raw_faiss)
    if not faiss_path.is_absolute():
        faiss_path = (Path(__file__).resolve().parent / faiss_path).resolve()

    embeddings = OpenAIEmbeddings(model=embed_model)
    persist_dir = str(faiss_path)
    index_file = faiss_path / "index.faiss"

    global _force_rebuild_done
    if (
        not _force_rebuild_done
        and os.getenv("RAG_FORCE_REBUILD", "").strip().lower() in ("1", "true", "yes")
        and faiss_path.exists()
    ):
        import shutil
        shutil.rmtree(faiss_path, ignore_errors=True)
        _force_rebuild_done = True

    if index_file.exists():
        return FAISS.load_local(
            persist_dir,
            embeddings,
            allow_dangerous_deserialization=True,
        )

    docs = _load_all_docs()
    if not docs:
        raise FileNotFoundError(
            "No chunks from System_Summary, AllBookPages-FullBook, or AllBookTables-csv. "
            "Check RAG_SOURCE_DIR or reference/.../TTRPG folder."
        )
    faiss_path.mkdir(parents=True, exist_ok=True)
    vs = FAISS.from_documents(docs, embeddings)
    vs.save_local(persist_dir)
    return vs


def retrieve(vectorstore, query: str, k: int = 6) -> list[Document]:
    """Return top-k chunks for query."""
    return vectorstore.similarity_search(query, k=k)


def format_chunks_for_prompt(chunks: list[Document]) -> str:
    """Turn retrieved chunks into a single string for system prompt."""
    out = []
    for d in chunks:
        meta = d.metadata
        out.append(f"[{meta.get('source', '')} — {meta.get('section', '')}]\n{d.page_content}")
    return "\n\n---\n\n".join(out)
