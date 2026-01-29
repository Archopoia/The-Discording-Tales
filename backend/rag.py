"""
RAG pipeline for Des Récits Discordants: load MDs, chunk by ##, embed, FAISS, retrieve.
Uses FAISS (no ChromaDB/onnxruntime) for compatibility with Python 3.14 and simpler install.
"""
from pathlib import Path
import re
import os

from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _default_source_dir() -> Path:
    """Locate systeme_drd via reference/.../systeme_drd; glob to handle encoding."""
    ref = Path("reference")
    for root in (_project_root(), _project_root().parent):
        r = (root / ref).resolve()
        if not r.is_dir():
            continue
        for sub in r.iterdir():
            if not sub.is_dir() or "TTRPG" not in sub.name:
                continue
            systeme = sub / "systeme_drd"
            if systeme.is_dir():
                return systeme
    return _project_root() / ref / "TTRPG - Des Récits Discordants" / "systeme_drd"


def _default_faiss_path() -> Path:
    return Path(__file__).resolve().parent / "faiss_drd"


_force_rebuild_done = False


def load_and_chunk_mds(source_dir: Path) -> list[Document]:
    """Load all .md files under source_dir, split by ## sections. One chunk per section."""
    docs: list[Document] = []
    source_dir = Path(source_dir)
    if not source_dir.is_dir():
        return docs

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
            docs.append(
                Document(
                    page_content=part,
                    metadata={"source": name, "section": section},
                )
            )
    return docs


def build_or_get_index(
    source_dir: Path | None = None,
    faiss_path: Path | None = None,
    embed_model: str = "text-embedding-3-small",
):
    """Build FAISS index from MDs if missing, else load. Return FAISS vectorstore.
    Set RAG_FORCE_REBUILD=1 (or true/yes) to delete existing index and rebuild from source."""
    source_dir = source_dir or _default_source_dir()
    source_dir = Path(source_dir)
    if not source_dir.is_absolute():
        source_dir = (_project_root() / source_dir).resolve()
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

    docs = load_and_chunk_mds(source_dir)
    if not docs:
        raise FileNotFoundError(f"No .md chunks under {source_dir}")
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
