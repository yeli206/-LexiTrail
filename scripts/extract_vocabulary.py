from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

try:
    from pdfplumber import open as pdfopen
except ImportError as exc:
    raise SystemExit("pdfplumber is required: pip install pdfplumber") from exc

POS = "(?:n|v|vt|vi|a|ad|adv|prep|conj|pron|num|art|aux|int)"
POS_ONLY = re.compile(r"^" + POS + r"\.", re.I)
POS_SUFFIX = re.compile(r"(?i)" + POS + r"\.(?:\s*&\s*" + POS + r"\.?)*(?:\(?)$")
V_AUX_SUFFIX = re.compile(r"(?i)v\.aux\.\(?$")
NOISE = {")", ")n", ")vi", "n", "…"}
MANUAL_WORDS = {
    "rmost": ["utmost"],
    "outeintegral": ["outer", "integral"],
    "northward(s)": ["northwards"],
    "iinfinitely": ["infinitely"],
    "ndefinite": ["indefinite"],
    "twatt": ["watt"],
    "mishief": ["mischief"],
    "dynamic(al)": ["dynamic"],
    "analytic(al)": ["analytic"],
    "shouldv.": ["should"],
}
DISPLAY_OVERRIDES = {
    "northwards": "northward(s)",
    "dynamic": "dynamic(al)",
    "analytic": "analytic(al)",
}
MANUAL_ALIASES = {
    "northwards": ["northward", "northwards"],
    "onward(s)": ["onward", "onwards"],
    "dynamic": ["dynamic", "dynamical"],
    "analytic": ["analytic", "analytical"],
    "jewellery": ["jewellery", "jewelry"],
    "harbour": ["harbour", "harbor"],
    "pyjamas": ["pyjamas", "pajamas"],
    "pedlar": ["pedlar", "peddler"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build LexiTrail vocabulary data from the source PDF and ECDICT.")
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--ecdict", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("src/data/vocabulary.json"))
    return parser.parse_args()


def clean_headword(raw: str) -> tuple[str, list[str]]:
    pos_tags: list[str] = []
    text = raw.strip()
    while True:
        match = POS_SUFFIX.search(text)
        if not match or match.start() == 0:
            break
        pos_tags.insert(0, match.group(0).rstrip("("))
        text = text[: match.start()].strip()
    match = V_AUX_SUFFIX.search(text)
    if match and match.start() > 0:
        pos_tags.insert(0, "v.aux.")
        text = text[: match.start()].strip()
    return text.rstrip("(").strip(), pos_tags


def extract_pdf_words(pdf_path: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with pdfopen(str(pdf_path)) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            for word in page.extract_words(extra_attrs=["fontname"]):
                token = word["text"]
                if "BookmanOldStyle" not in word.get("fontname", ""):
                    continue
                if not any(char.isalpha() for char in token):
                    continue
                if POS_ONLY.match(token):
                    if rows:
                        rows[-1]["pos"].append(token.rstrip("("))
                    continue

                display, pos_tags = clean_headword(token)
                if not display or display in NOISE:
                    continue
                variants = MANUAL_WORDS.get(display.lower(), [display])
                for variant in variants:
                    rows.append(
                        {
                            "page": page_number,
                            "top": round(float(word["top"]), 1),
                            "display": DISPLAY_OVERRIDES.get(variant.lower(), variant),
                            "lookup": variant.lower(),
                            "pos": list(pos_tags),
                        }
                    )

    seen: set[str] = set()
    unique: list[dict[str, object]] = []
    for row in rows:
        key = str(row["lookup"]).lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)
    return unique


def load_ecdict(path: Path) -> dict[str, dict[str, str]]:
    entries: dict[str, dict[str, str]] = {}
    with path.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            word = (row.get("word") or "").strip().lower()
            if word:
                entries[word] = row
    return entries


def parse_exchange(exchange: str | None) -> list[str]:
    if not exchange:
        return []
    aliases: list[str] = []
    for part in exchange.split("/"):
        if ":" not in part:
            continue
        kind, value = part.split(":", 1)
        if kind not in {"p", "d", "i", "3", "s", "r", "t", "0", "1"}:
            continue
        for candidate in re.split(r"[,，]", value):
            cleaned = candidate.strip().lower()
            if cleaned and cleaned not in aliases:
                aliases.append(cleaned)
    return aliases


def compact_translation(row: dict[str, str]) -> str:
    translation = (row.get("translation") or "").strip()
    if not translation:
        translation = (row.get("definition") or "").strip()
    translation = re.sub(r"\[(?:网络|医|化|经|法|计|机|电|建|军|生物)\]\s*", "", translation)
    translation = translation.replace("\\n", "；")
    translation = re.sub(r"\s*\n+\s*", "；", translation)
    translation = re.sub(r"；{2,}", "；", translation)
    return translation.strip("； ")[:320]


def pos_from_row(row: dict[str, str], fallback: list[str]) -> list[str]:
    if fallback:
        return [item.rstrip(".").replace(" ", "") for item in fallback]
    found = re.findall(r"(?i)(?:v\.aux\.|vt\.|vi\.|v\.|n\.|a\.|ad\.|prep\.|conj\.|pron\.|num\.|art\.|aux\.|int\.)", row.get("translation", ""))
    return list(dict.fromkeys(item.rstrip(".") for item in found))


def main() -> None:
    args = parse_args()
    extracted = extract_pdf_words(args.pdf)
    ecdict = load_ecdict(args.ecdict)

    vocabulary = []
    unresolved = []
    for source_order, item in enumerate(extracted, start=1):
        lookup = str(item["lookup"]).lower()
        row = ecdict.get(lookup)
        if row is None:
            unresolved.append({"sourceOrder": source_order, "display": item["display"], "lookup": lookup})
            continue

        aliases = set(MANUAL_ALIASES.get(lookup, []))
        aliases.update(parse_exchange(row.get("exchange")))
        aliases.add(lookup)
        aliases.update(part.lower() for part in re.findall(r"[A-Za-z][A-Za-z'-]*", str(item["display"])))
        aliases = sorted(alias for alias in aliases if alias)

        vocabulary.append(
            {
                "id": f"w{source_order:04d}",
                "lemma": lookup,
                "display": item["display"],
                "phonetic": (row.get("phonetic") or "").strip(),
                "partOfSpeech": pos_from_row(row, list(item["pos"])),
                "translation": compact_translation(row),
                "aliases": aliases,
                "sourceOrder": source_order,
                "exchange": (row.get("exchange") or "").strip(),
            }
        )

    expected = 2085
    if len(vocabulary) != expected:
        raise SystemExit(
            f"Expected {expected} resolved entries, found {len(vocabulary)}; "
            f"unresolved={json.dumps(unresolved, ensure_ascii=False)}"
        )

    output = {
        "meta": {
            "source": "用户提供的《大学英语六级词汇乱序版》",
            "authority": "第三方资料，非全国大学英语四六级考试官方大纲",
            "count": len(vocabulary),
            "dictionary": "ECDICT",
            "dictionaryLicense": "MIT",
        },
        "entries": vocabulary,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(vocabulary)} vocabulary entries to {args.out}")


if __name__ == "__main__":
    main()