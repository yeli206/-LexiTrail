import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import vocabularyData from "../src/data/vocabulary.json";

const vocabulary = vocabularyData.entries;
const byLemma = new Map<string, (typeof vocabulary)[number]>();
const byAlias = new Map<string, (typeof vocabulary)[number]>();
for (const entry of vocabulary) {
  byLemma.set(entry.lemma.toLowerCase(), entry);
  byAlias.set(entry.display.toLowerCase(), entry);
  for (const alias of entry.aliases) {
    const key = alias.toLowerCase();
    if (key.length < 2 || alias === entry.lemma) continue;
    if (!byAlias.has(key) && !byLemma.has(key)) byAlias.set(key, entry);
  }
}

const contentDir = path.join(process.cwd(), "content", "articles");
const files = fs.existsSync(contentDir)
  ? fs.readdirSync(contentDir).filter((file) => file.endsWith(".md")).sort()
  : [];
const failures: string[] = [];
const owner = new Map<string, string>();

for (const file of files) {
  const source = fs.readFileSync(path.join(contentDir, file), "utf8");
  const { data, content } = matter(source);
  const words = content.match(/[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g) ?? [];
  const focusWords = Array.isArray(data.focusWords) ? (data.focusWords as string[]) : [];
  const found = new Set<string>();

  for (const token of words) {
    const normalized = token.toLowerCase().replace("’", "'").replace(/'s$/, "");
    const entry = byLemma.get(normalized) ?? byAlias.get(normalized);
    if (entry) found.add(entry.lemma);
  }

  if (words.length < 650 || words.length > 750) failures.push(`${file}: word count ${words.length}, expected 650-750`);
  if (focusWords.length < 46 || focusWords.length > 47) failures.push(`${file}: expected 46-47 assigned words, found ${focusWords.length}`);
  if (new Set(focusWords).size !== focusWords.length) failures.push(`${file}: duplicate focus words`);

  for (const focus of focusWords) {
    const entry = byLemma.get(focus.toLowerCase());
    if (!entry) {
      failures.push(`${file}: unknown focus word ${focus}`);
      continue;
    }
    if (owner.has(entry.lemma)) failures.push(`${file}: ${focus} already assigned to ${owner.get(entry.lemma)}`);
    else owner.set(entry.lemma, file);
    if (!found.has(entry.lemma)) failures.push(`${file}: missing assigned word ${focus}`);
  }
  if (!Array.isArray(data.sources) || data.sources.length < 3 || data.sources.length > 5) failures.push(`${file}: expected 3-5 sources`);
  console.log(`${data.slug ?? file}: ${words.length} words, ${focusWords.length} assigned`);
}

for (const entry of vocabulary) {
  if (!owner.has(entry.lemma)) failures.push(`Unassigned vocabulary entry: ${entry.display}`);
}

if (files.length !== 45) failures.push(`Expected 45 articles, found ${files.length}`);
console.log(`\nCoverage: ${owner.size}/${vocabulary.length} (${((owner.size / vocabulary.length) * 100).toFixed(1)}%)`);

if (failures.length) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Content validation passed.");
