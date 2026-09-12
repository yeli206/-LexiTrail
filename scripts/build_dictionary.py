from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

POS_PATTERN = re.compile(
    r"(?i)(?:v\.aux\.|vt\.|vi\.|v\.|n\.|a\.|ad\.|adv\.|prep\.|conj\.|pron\.|num\.|art\.|aux\.|int\.)"
)
TOKEN_PATTERN = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build local ECDICT chunks for LexiTrail.")
    parser.add_argument("--ecdict", type=Path, required=True)
    parser.add_argument("--vocabulary", type=Path, default=Path("src/data/vocabulary.json"))
    parser.add_argument("--content", type=Path, default=Path("content/articles"))
    parser.add_argument("--out", type=Path, default=Path("public/data/dictionary"))
    parser.add_argument("--report", type=Path, default=Path(".cache/dictionary-report.json"))
    return parser


def clean_translation(value: str) -> str:
    value = value.replace("\\n", "；")
    value = re.sub(r"\[(?:网络|医|化|经|法|计|机|电|建|军|生物)\]\s*", "", value)
    value = re.sub(r"\s*\n+\s*", "；", value)
    value = re.sub(r"；{2,}", "；", value)
    return value.strip("； ")[:500]


def normalize_token(token: str) -> str:
    value = token.lower().replace("’", "'")
    if value.endswith("'s"):
        value = value[:-2]
    return value


def tokens_in_markdown(path: Path) -> set[str]:
    if not path.exists():
        return set()
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            text = parts[2]
    return {normalize_token(token) for token in TOKEN_PATTERN.findall(text)}


def main() -> None:
    args = build_arg_parser().parse_args()
    source = json.loads(args.vocabulary.read_text(encoding="utf-8"))
    vocab_entries = source["entries"]

    wanted: set[str] = set()
    for entry in vocab_entries:
        wanted.add(entry["lemma"].lower())
        wanted.update(alias.lower() for alias in entry["aliases"])
    if args.content.exists():
        for path in args.content.glob("*.md"):
            wanted.update(tokens_in_markdown(path))

    ecdict: dict[str, dict[str, str]] = {}
    with args.ecdict.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            word = normalize_token((row.get("word") or "").strip())
            if word:
                ecdict[word] = row

    records: dict[str, dict[str, object]] = {}
    by_source_id: dict[str, dict[str, object]] = {}

    for entry in vocab_entries:
        row = ecdict.get(entry["lemma"])
        if not row:
            continue
        record = {
            "word": entry["display"],
            "lemma": entry["lemma"],
            "phonetic": entry["phonetic"],
            "translation": clean_translation(entry["translation"]),
            "partOfSpeech": entry["partOfSpeech"],
            "sourceId": entry["id"],
        }
        by_source_id[entry["id"]] = record
        records[normalize_token(entry["lemma"])] = record
        records[normalize_token(entry["display"])] = record

    for entry in vocab_entries:
        record = by_source_id.get(entry["id"])
        if not record:
            continue
        for alias in entry["aliases"]:
            key = normalize_token(alias)
            if len(key) >= 2:
                records.setdefault(key, record)

    unknown: set[str] = set()
    for word in wanted:
        if word in records:
            continue
        row = ecdict.get(word)
        if not row:
            unknown.add(word)
            continue
        records[word] = {
            "word": row.get("word") or word,
            "lemma": word,
            "phonetic": (row.get("phonetic") or "").strip(),
            "translation": clean_translation(row.get("translation") or row.get("definition") or ""),
            "partOfSpeech": list(dict.fromkeys(POS_PATTERN.findall(row.get("translation") or ""))),
        }

    fallback_records = {
        "chatbots": ("chatbot", "聊天机器人（复数形式）"),
        "customer-support": ("customer support", "客户支持；客户服务"),
        "hundred-yuan": ("hundred yuan", "一百元的"),
        "intention-action": ("intention action", "意图与行动之间的"),
        "ivory-colored": ("ivory colored", "象牙色的"),
        "ivory-handled": ("ivory handled", "象牙柄的"),
        "ten-minute": ("ten minute", "十分钟的"),
    }
    for word in list(unknown):
        lemma, translation = fallback_records.get(word, (word, "复合词；请结合上下文理解"))
        records[word] = {
            "word": word,
            "lemma": lemma,
            "phonetic": "",
            "translation": translation,
            "partOfSpeech": [],
        }
        unknown.discard(word)

    chunks: dict[str, dict[str, object]] = {}
    for key, record in records.items():
        bucket = key[0] if key and "a" <= key[0] <= "z" else "other"
        chunks.setdefault(bucket, {})[key] = record

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out.parent / "vocabulary.json").write_text(json.dumps(source, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for path in args.out.glob("*.json"):
        path.unlink()
    for bucket, payload in chunks.items():
        (args.out / f"{bucket}.json").write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    report = {
        "recordCount": len(records),
        "chunks": {key: len(value) for key, value in sorted(chunks.items())},
        "unknown": sorted(unknown),
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()