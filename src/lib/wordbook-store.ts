import type { DictionaryRecord, SavedWord, WordbookState } from "@/lib/types";

const STORAGE_KEY = "lexitrail-wordbook-v1";
const EMPTY_STATE: WordbookState = { version: 1, words: [] };

let state: WordbookState = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist(next: WordbookState) {
  state = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function cleanStoredState(value: unknown): WordbookState {
  if (!value || typeof value !== "object") return EMPTY_STATE;
  const candidate = value as Partial<WordbookState>;
  if (candidate.version !== 1 || !Array.isArray(candidate.words)) return EMPTY_STATE;
  return {
    version: 1,
    words: candidate.words.filter((word): word is SavedWord => {
      return Boolean(word && typeof word === "object" && typeof word.lemma === "string");
    }),
  };
}

export function hydrateWordbook() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state = cleanStoredState(JSON.parse(stored));
    } catch {
      state = EMPTY_STATE;
    }
  }
  initialized = true;
  emit();
}

export function subscribeWordbook(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWordbookSnapshot() {
  if (!initialized && typeof window !== "undefined") hydrateWordbook();
  return state;
}

export function getWordbookServerSnapshot() {
  return EMPTY_STATE;
}

export function addWord(input: {
  dictionary: DictionaryRecord;
  articleSlug: string;
  articleTitle: string;
  sentence: string;
  isSyllabus: boolean;
}) {
  const now = new Date().toISOString();
  const existing = state.words.find((word) => word.lemma === input.dictionary.lemma);
  const occurrence = {
    articleSlug: input.articleSlug,
    articleTitle: input.articleTitle,
    sentence: input.sentence.trim().slice(0, 600),
    savedAt: now,
  };

  if (existing) {
    const duplicate = existing.occurrences.some(
      (item) => item.articleSlug === occurrence.articleSlug && item.sentence === occurrence.sentence,
    );
    const previous = structuredClone(existing);
    const updated: SavedWord = {
      ...existing,
      display: existing.display || input.dictionary.word,
      phonetic: existing.phonetic || input.dictionary.phonetic,
      partOfSpeech: existing.partOfSpeech.length ? existing.partOfSpeech : input.dictionary.partOfSpeech,
      translation: existing.translation || input.dictionary.translation,
      isSyllabus: existing.isSyllabus || input.isSyllabus,
      updatedAt: now,
      occurrences: duplicate ? existing.occurrences : [occurrence, ...existing.occurrences].slice(0, 12),
    };
    persist({ version: 1, words: state.words.map((word) => (word.lemma === existing.lemma ? updated : word)) });
    return { word: updated, previous, wasNew: false, duplicate };
  }

  const saved: SavedWord = {
    lemma: input.dictionary.lemma,
    display: input.dictionary.word,
    phonetic: input.dictionary.phonetic,
    partOfSpeech: input.dictionary.partOfSpeech,
    translation: input.dictionary.translation,
    isSyllabus: input.isSyllabus,
    sourceId: input.dictionary.sourceId,
    occurrences: [occurrence],
    updatedAt: now,
  };

  persist({ version: 1, words: [saved, ...state.words] });
  return { word: saved, previous: null, wasNew: true, duplicate: false };
}

export function removeWord(lemma: string) {
  persist({ version: 1, words: state.words.filter((word) => word.lemma !== lemma) });
}

export function restoreWord(word: SavedWord) {
  const next = state.words.filter((item) => item.lemma !== word.lemma);
  persist({ version: 1, words: [word, ...next] });
}

export function replaceWordbook(next: WordbookState) {
  persist(cleanStoredState(next));
}

export function clearWordbook() {
  persist(EMPTY_STATE);
}

export function parseWordbookBackup(value: unknown) {
  return cleanStoredState(value);
}

export function downloadWordbookJson() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `lexitrail-wordbook-${new Date().toISOString().slice(0, 10)}.json`);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function downloadWordbookCsv() {
  const header = ["word", "lemma", "phonetic", "translation", "article", "sentence", "savedAt"];
  const rows = state.words.flatMap((word) =>
    word.occurrences.map((occurrence) => [
      word.display,
      word.lemma,
      word.phonetic,
      word.translation,
      occurrence.articleTitle,
      occurrence.sentence,
      occurrence.savedAt,
    ]),
  );
  const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `lexitrail-wordbook-${new Date().toISOString().slice(0, 10)}.csv`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function wordbookStorageKey() {
  return STORAGE_KEY;
}