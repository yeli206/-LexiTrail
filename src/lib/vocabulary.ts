import vocabularyData from "@/data/vocabulary.json";
import type { VocabularyEntry } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

export const vocabulary = vocabularyData.entries as VocabularyEntry[];
export const vocabularyMeta = vocabularyData.meta;

const entryByLemma = new Map<string, VocabularyEntry>();
const entryByAlias = new Map<string, VocabularyEntry>();

for (const entry of vocabulary) {
  entryByLemma.set(entry.lemma.toLowerCase(), entry);
  entryByAlias.set(entry.lemma.toLowerCase(), entry);
  entryByAlias.set(entry.display.toLowerCase(), entry);
  for (const alias of entry.aliases) {
    entryByAlias.set(alias.toLowerCase(), entry);
  }
}

export function getVocabularyEntry(token: string) {
  const normalized = normalizeToken(token);
  return entryByAlias.get(normalized) ?? entryByLemma.get(normalized) ?? null;
}

export function findVocabularyMatches(text: string) {
  const found = new Map<string, VocabularyEntry>();
  const tokens = text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g) ?? [];
  for (const token of tokens) {
    const entry = getVocabularyEntry(token);
    if (entry && !found.has(entry.id)) {
      found.set(entry.id, entry);
    }
  }
  return [...found.values()].sort((a, b) => a.sourceOrder - b.sourceOrder);
}

export function vocabularyById() {
  return new Map(vocabulary.map((entry) => [entry.id, entry]));
}