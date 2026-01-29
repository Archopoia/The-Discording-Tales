"""
One-off script to build the RAG FAISS index from System_Summary, AllBookPages, AllBookTables.
Loads backend/.env; requires OPENAI_API_KEY. Run from project root: python backend/build_rag_index.py
"""
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from rag import build_or_get_index

if __name__ == "__main__":
    vs = build_or_get_index()
    print("RAG index built successfully.")
