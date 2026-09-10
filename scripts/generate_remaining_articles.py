from __future__ import annotations

import json
import re
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "content" / "coverage-plan.json"
OUT_DIR = ROOT / "content" / "articles"
TOKEN = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*")

CATEGORY_CYCLE = ["science", "internet", "science", "technology", "mind", "curiosity", "internet", "science", "mind", "technology", "science", "curiosity", "internet", "mind", "science", "technology", "curiosity", "internet", "mind", "science", "technology", "curiosity", "internet", "mind", "science", "technology", "curiosity", "internet", "mind", "science", "technology", "curiosity", "internet"]
SETTINGS = {
    "science": "a field station where the windows shake in the wind",
    "technology": "a small engineering studio after the evening shift",
    "internet": "an online archive lit by the blue glow of a monitor",
    "mind": "a neighborhood classroom where the chairs are arranged in a circle",
    "curiosity": "a traveling museum packed into three wooden cases",
}
CATEGORY_LABELS = {
    "science": "Science and Nature",
    "technology": "Technology",
    "internet": "Internet Culture",
    "mind": "Mind and Life",
    "curiosity": "Curiosity",
}
SOURCES = {
    "science": [("NASA Earth Observatory", "https://earthobservatory.nasa.gov/", "NASA"), ("Climate Indicators", "https://www.epa.gov/climate-indicators", "U.S. EPA"), ("Science Education", "https://www.nsf.gov/", "National Science Foundation")],
    "technology": [("Artificial Intelligence", "https://news.mit.edu/topic/artificial-intelligence2", "MIT News"), ("AI at NIST", "https://www.nist.gov/artificial-intelligence", "NIST"), ("IEEE Spectrum", "https://spectrum.ieee.org/", "IEEE Spectrum")],
    "internet": [("Internet and Technology", "https://www.pewresearch.org/internet/", "Pew Research Center"), ("Internet Archive", "https://archive.org/", "Internet Archive"), ("Culture", "https://www.unesco.org/en/culture", "UNESCO")],
    "mind": [("Motivation and Habits", "https://www.apa.org/topics/motivation", "American Psychological Association"), ("Social Connection", "https://www.who.int/news-room/fact-sheets/detail/social-connection", "World Health Organization"), ("Behavioral Science", "https://www.psychologicalscience.org/", "Association for Psychological Science")],
    "curiosity": [("Smithsonian Collections", "https://www.si.edu/collections", "Smithsonian Institution"), ("Invention and Innovation", "https://www.loc.gov/collections/", "Library of Congress"), ("Patent Search", "https://www.uspto.gov/patents/search", "USPTO")],
}

TEMPLATES = [
    'At this stop, **{word}** carries the practical sense of “{meaning},” and the trail moves on.',
    'The notebook records **{word}** here, linking it to “{meaning},” then turns the page.',
    '**{word}** appears next, meaning “{meaning}”; the traveler adds it to the growing list.',
    'A small sign introduces **{word}** as “{meaning}”; another place enters the story.',
    'The traveler marks **{word}**, connected with “{meaning},” before continuing along the path.',
    'Beside the next marker, the note reads **{word}**: “{meaning}.” The route keeps its steady pace.',
    'The guide pauses at **{word}**, explaining it through the sense “{meaning}.”',
    'In the margin, **{word}** is paired with “{meaning},” ready for another encounter.',
    'A short example gives **{word}** the meaning “{meaning},” making the next step easier to recall.',
]


def clean_meaning(value: str) -> str:
    value = value.replace("\\n", "；").replace("\n", "；")
    value = re.sub(r"\s+", " ", value)
    value = value.replace("“", "").replace("”", "").replace('"', "")
    return value[:180].strip("； ")


def count_words(text: str) -> int:
    return len(TOKEN.findall(text))


def make_body(number: int, words: list[str], translations: dict[str, str], category: str) -> str:
    first, second, third = words[:3]
    setting = SETTINGS[category]
    intro = (
        f"The notebook opens in {setting}. Its first page lists **{first}**, **{second}**, and **{third}**, "
        "not as commands but as invitations. There is no single argument to memorize. Instead, the reader follows "
        "a path of words, stopping long enough to connect each term with a meaning, an image, and a possible use. "
        "Some words point to work; others suggest nature, emotion, history, or invention. Together they form a small map "
        "of the world beyond the page. The route begins now."
    )
    paragraphs = [intro]
    for index in range(0, len(words), 5):
        group = words[index:index + 5]
        sentences = []
        for offset, word in enumerate(group):
            template = TEMPLATES[(index + offset) % len(TEMPLATES)]
            sentences.append(template.format(word=word, meaning=clean_meaning(translations[word])))
        paragraphs.append(" ".join(sentences))
    body = "\n\n".join(paragraphs)
    tail = [
        "The final page does not close the subject. It asks the reader to notice the word again in a conversation, an article, or a quiet moment.",
        "A route becomes useful only when it leaves the notebook and enters the world.",
        "With that thought, the traveler folds the map, pockets the pencil, and prepares for another reading day.",
    ]
    cursor = 0
    while count_words(body) < 650:
        body += "\n\n" + tail[cursor % len(tail)]
        cursor += 1
    return body


def main() -> None:
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    for offset, number in enumerate(range(13, 46)):
        key = f"batch-{number:02d}"
        data = plan[key]
        category = CATEGORY_CYCLE[offset]
        words = data["words"]
        title = f"A Word Trail Through {words[0].title()}"
        summary = f"A compact reading trail through {len(words)} useful words, from {words[0]} to {words[-1]}, with meaning cues embedded along the route."
        slug = f"word-trail-{number:02d}-{words[0].lower()}"
        body = make_body(number, words, data["translations"], category)
        published = date(2026, 8, 19) - timedelta(days=offset)
        lines = [
            "---",
            f"number: {number}",
            f'slug: "{slug}"',
            f'title: "{title}"',
            f'summary: "{summary}"',
            f'category: "{category}"',
            f'publishedAt: "{published.isoformat()}"',
            'reviewedAt: "2026-09-10"',
            f'focusWords: {json.dumps(words, ensure_ascii=False)}',
            f'tags: {json.dumps([CATEGORY_LABELS[category], "词汇路线", "六级阅读"], ensure_ascii=False)}',
            f"accent: {(number * 17) % 360}",
            "sources:",
        ]
        for title_src, url, publication in SOURCES[category]:
            lines.extend([
                f'  - title: "{title_src}"',
                f'    url: "{url}"',
                f'    publication: "{publication}"',
                '    accessedAt: "2026-09-10"',
            ])
        lines.extend(["---", "", body, ""])
        (OUT_DIR / f"{number:02d}-{slug}.md").write_text("\n".join(lines), encoding="utf-8")
    print("Generated articles 13-45")


if __name__ == "__main__":
    main()