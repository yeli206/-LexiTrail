import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import vocabularyData from "../src/data/vocabulary.json";

const vocabulary = vocabularyData.entries;
const byAlias = new Map<string, (typeof vocabulary)[number]>();
for (const entry of vocabulary) {
  byAlias.set(entry.lemma.toLowerCase(), entry);
  byAlias.set(entry.display.toLowerCase(), entry);
  for (const alias of entry.aliases) byAlias.set(alias.toLowerCase(), entry);
}

const contentDir = path.join(process.cwd(), "content", "articles");
const files = fs.existsSync(contentDir)
  ? fs.readdirSync(contentDir).filter((file) => file.endsWith(".md")).sort()
  : [];

const focusSets = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "focus-sets.json"), "utf8")) as Record<string, string[]>;
const failures: string[] = [];
const allCovered = new Map<string, string>();

for (const file of files) {
  const source = fs.readFileSync(path.join(contentDir, file), "utf8");
  const { data, content } = matter(source);
  const words = content.match(/[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g) ?? [];
  const expectedFocus = focusSets[data.slug as string] ?? data.focusWords ?? [];
  const found = new Map<string, string>();

  for (const token of words) {
    const entry = byAlias.get(token.toLowerCase().replace("’", "'").replace(/'s$/, ""));
    if (entry) found.set(entry.lemma, entry.display);
  }

  if (words.length < 650 || words.length > 750) failures.push(`${file}: word count ${words.length}, expected 650-750`);
  if (!Array.isArray(data.focusWords) || data.focusWords.length < 35 || data.focusWords.length > 45) {
    failures.push(`${file}: frontmatter focusWords must contain 35-45 entries`);
  }
  if (expectedFocus.length < 35 || expectedFocus.length > 45) failures.push(`${file}: focus set has ${expectedFocus.length} entries`);
  for (const focus of expectedFocus) {
    const entry = byAlias.get(focus);
    if (!entry) failures.push(`${file}: unknown focus word ${focus}`);
    if (entry && !found.has(entry.lemma)) failures.push(`${file}: missing focus word ${focus}`);
  }
  if (!Array.isArray(data.sources) || data.sources.length < 3 || data.sources.length > 5) failures.push(`${file}: expected 3-5 sources`);
  if (!found.size) failures.push(`${file}: no vocabulary matched`);

  for (const [lemma] of found) {
    if (!allCovered.has(lemma)) allCovered.set(lemma, file);
  }

  console.log(`${data.slug ?? file}: ${words.length} words, ${found.size} matched, ${expectedFocus.length} focus`);
}

if (files.length < 10) failures.push(`Expected at least 10 articles, found ${files.length}`);
console.log(`\nCoverage: ${allCovered.size}/${vocabulary.length} (${((allCovered.size / vocabulary.length) * 100).toFixed(1)}%)`);

if (failures.length) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Content validation passed.");