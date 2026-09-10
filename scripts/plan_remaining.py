from __future__ import annotations

import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOCAB_PATH = ROOT / "src" / "data" / "vocabulary.json"
ARTICLES_DIR = ROOT / "content" / "articles"
FOCUS_PATH = ROOT / "content" / "focus-sets.json"
PLAN_PATH = ROOT / "content" / "coverage-plan.json"
TOKEN_PATTERN = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*")


def normalize(value: str) -> str:
    value = value.lower().replace("’", "'")
    return value[:-2] if value.endswith("'s") else value


def body_without_frontmatter(text: str) -> str:
    if text.startswith("---"):
        parts = text.split("---", 2)
        return parts[2] if len(parts) == 3 else text
    return text


def main() -> None:
    vocabulary = json.loads(VOCAB_PATH.read_text(encoding="utf-8"))["entries"]
    alias_to_lemma = {}
    for entry in vocabulary:
        for alias in {entry["lemma"], entry["display"], *entry["aliases"]}:
            alias_to_lemma[normalize(alias)] = entry["lemma"]

    covered = set()
    for article in sorted(ARTICLES_DIR.glob("*.md")):
        for token in TOKEN_PATTERN.findall(body_without_frontmatter(article.read_text(encoding="utf-8"))):
            lemma = alias_to_lemma.get(normalize(token))
            if lemma:
                covered.add(lemma)

    remaining = [entry for entry in vocabulary if entry["lemma"] not in covered]
    if not remaining:
        print(json.dumps({"covered": len(covered), "remaining": 0, "groups": 0, "sizes": []}, ensure_ascii=False))
        return
    group_count = math.ceil(len(remaining) / 45)
    base, extra = divmod(len(remaining), group_count)
    sizes = [base + (1 if index < extra else 0) for index in range(group_count)]
    if min(sizes) < 35 or max(sizes) > 45:
        raise SystemExit(f"Cannot distribute {len(remaining)} words into valid article sizes: {sizes}")

    focus_sets = json.loads(FOCUS_PATH.read_text(encoding="utf-8"))
    plan = {}
    cursor = 0
    for offset, size in enumerate(sizes):
        article_number = 11 + offset
        key = f"batch-{article_number:02d}"
        entries = remaining[cursor : cursor + size]
        cursor += size
        plan[key] = {
            "number": article_number,
            "words": [entry["lemma"] for entry in entries],
            "translations": {entry["lemma"]: entry["translation"] for entry in entries},
        }
        if key not in focus_sets:
            focus_sets[key] = plan[key]["words"]

    FOCUS_PATH.write_text(json.dumps(focus_sets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PLAN_PATH.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"covered": len(covered), "remaining": len(remaining), "groups": group_count, "sizes": sizes}, ensure_ascii=False))


if __name__ == "__main__":
    main()