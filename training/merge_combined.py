"""Merge train.jsonl + debiasing.jsonl -> train_combined.jsonl. Run from project root."""
from pathlib import Path
p = Path(__file__).resolve().parent
with open(p / "train_combined.jsonl", "w", encoding="utf-8") as out:
    for f in ["train.jsonl", "debiasing.jsonl"]:
        with open(p / f, "r", encoding="utf-8") as inp:
            for line in inp:
                if line.strip():
                    out.write(line)
n = sum(1 for _ in open(p / "train_combined.jsonl", encoding="utf-8"))
print("train_combined.jsonl lines:", n)
