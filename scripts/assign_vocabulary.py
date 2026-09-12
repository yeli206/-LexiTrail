from __future__ import annotations
import json
import re
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "content" / "articles"
VOCAB = ROOT / "src" / "data" / "vocabulary.json"
OWNERSHIP = ROOT / "content" / "vocabulary-ownership.json"
TOKEN = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*")

def normalize(value: str) -> str:
    value = value.lower().replace("’", "'")
    return value[:-2] if value.endswith("'s") else value

class Dinic:
    def __init__(self, size: int) -> None:
        self.graph = [[] for _ in range(size)]
    def add(self, source: int, target: int, capacity: int) -> None:
        forward = [target, capacity, len(self.graph[target])]
        backward = [source, 0, len(self.graph[source])]
        self.graph[source].append(forward)
        self.graph[target].append(backward)
    def max_flow(self, source: int, sink: int) -> int:
        total = 0
        while True:
            level = [-1] * len(self.graph)
            level[source] = 0
            queue = deque([source])
            while queue:
                node = queue.popleft()
                for target, capacity, _ in self.graph[node]:
                    if capacity > 0 and level[target] < 0:
                        level[target] = level[node] + 1
                        queue.append(target)
            if level[sink] < 0:
                return total
            cursor = [0] * len(self.graph)
            def send(node: int, available: int) -> int:
                if node == sink:
                    return available
                while cursor[node] < len(self.graph[node]):
                    edge = self.graph[node][cursor[node]]
                    target, capacity, reverse = edge
                    if capacity > 0 and level[target] == level[node] + 1:
                        pushed = send(target, min(available, capacity))
                        if pushed:
                            edge[1] -= pushed
                            self.graph[target][reverse][1] += pushed
                            return pushed
                    cursor[node] += 1
                return 0
            while True:
                pushed = send(source, 10**9)
                if not pushed:
                    break
                total += pushed

def main() -> None:
    entries = json.loads(VOCAB.read_text(encoding="utf-8"))["entries"]
    lemma_to_id = {}
    alias_to_id = {}
    for entry in entries:
        lemma_to_id[normalize(entry["lemma"])] = entry["id"]
        for alias in {entry["display"], *entry["aliases"]}:
            key = normalize(alias)
            if len(key) < 2 or key in lemma_to_id:
                continue
            if key not in alias_to_id:
                alias_to_id[key] = entry["id"]

    files = sorted(ARTICLES.glob("*.md"))
    numbers = []
    slugs = {}
    available = {}
    for file in files:
        text = file.read_text(encoding="utf-8")
        number = int(re.search(r"^number:\s*(\d+)", text, re.M).group(1))
        slug = re.search(r'^slug:\s*"([^"]+)"', text, re.M).group(1)
        body = text.split("---", 2)[2]
        ids = set()
        for token in TOKEN.findall(body):
            key = normalize(token)
            entry_id = lemma_to_id.get(key) or alias_to_id.get(key)
            if entry_id:
                ids.add(entry_id)
        numbers.append(number)
        slugs[number] = slug
        available[number] = ids

    target = {number: 47 if number % 3 == 0 else 46 for number in numbers}
    if sum(target.values()) != len(entries):
        raise SystemExit(f"Target mismatch: {sum(target.values())} vs {len(entries)}")
    source = 0
    word_offset = 1
    article_offset = word_offset + len(entries)
    sink = article_offset + len(numbers)
    flow = Dinic(sink + 1)
    index_by_number = {number: index for index, number in enumerate(numbers)}
    for index, entry in enumerate(entries):
        node = word_offset + index
        flow.add(source, node, 1)
        for number in numbers:
            if entry["id"] in available[number]:
                flow.add(node, article_offset + index_by_number[number], 1)
    for index, number in enumerate(numbers):
        flow.add(article_offset + index, sink, target[number])

    result = flow.max_flow(source, sink)
    if result != len(entries):
        raise SystemExit(f"Could only assign {result} of {len(entries)} entries")

    assignments = {number: [] for number in numbers}
    for index, entry in enumerate(entries):
        node = word_offset + index
        for edge in flow.graph[node]:
            target_node, capacity, _ = edge
            if article_offset <= target_node < sink and capacity == 0:
                assignments[numbers[target_node - article_offset]].append(entry)
                break

    for number, items in assignments.items():
        items.sort(key=lambda entry: entry["sourceOrder"])
        if len(items) != target[number]:
            raise SystemExit(f"Article {number}: {len(items)} != {target[number]}")
        file = next(ARTICLES.glob(f"{number:02d}-*.md"))
        text = file.read_text(encoding="utf-8")
        focus = [entry["lemma"] for entry in items]
        text = re.sub(r"^focusWords:\s*\[.*\]$", f"focusWords: {json.dumps(focus, ensure_ascii=False)}", text, count=1, flags=re.M)
        file.write_text(text, encoding="utf-8")

    OWNERSHIP.write_text(json.dumps({
        "meta": {"count": len(entries), "articles": len(numbers), "highlightRule": "one assigned first occurrence per word"},
        "articles": {slugs[number]: [entry["lemma"] for entry in items] for number, items in assignments.items()}
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"assigned": result, "articleSizes": target}, ensure_ascii=False))

if __name__ == "__main__":
    main()
