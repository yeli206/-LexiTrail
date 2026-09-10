import { beforeEach, describe, expect, it } from "vitest";
import {
  addWord,
  clearWordbook,
  getWordbookSnapshot,
  hydrateWordbook,
  parseWordbookBackup,
  removeWord,
} from "@/lib/wordbook-store";
import type { DictionaryRecord } from "@/lib/types";

const dictionary: DictionaryRecord = {
  word: "unique",
  lemma: "unique",
  phonetic: "ju:'ni:k",
  translation: "独特的",
  partOfSpeech: ["a"],
};

describe("wordbook store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearWordbook();
    hydrateWordbook();
  });

  it("adds, deduplicates, and removes a saved word", () => {
    const first = addWord({ dictionary, articleSlug: "test", articleTitle: "Test", sentence: "A unique idea.", isSyllabus: true });
    expect(first.wasNew).toBe(true);
    expect(getWordbookSnapshot().words).toHaveLength(1);

    const second = addWord({ dictionary, articleSlug: "test", articleTitle: "Test", sentence: "A unique idea.", isSyllabus: true });
    expect(second.duplicate).toBe(true);
    expect(getWordbookSnapshot().words[0].occurrences).toHaveLength(1);

    removeWord("unique");
    expect(getWordbookSnapshot().words).toHaveLength(0);
  });

  it("accepts a valid backup shape and rejects unrelated JSON", () => {
    const valid = parseWordbookBackup({ version: 1, words: [{ lemma: "unique" }] });
    expect(valid.words).toHaveLength(1);
    expect(parseWordbookBackup({ hello: "world" }).words).toHaveLength(0);
  });
});