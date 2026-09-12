import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import vocabularyData from "@/data/vocabulary.json";

describe("article content", () => {
  const files = fs.readdirSync(path.join(process.cwd(), "content", "articles"));

  it("ships 45 articles with valid lengths", () => {
    expect(files.length).toBeGreaterThanOrEqual(45);
    for (const file of files) {
      const { content } = matter(fs.readFileSync(path.join(process.cwd(), "content", "articles", file), "utf8"));
      const words = content.match(/[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g) ?? [];
      expect(words.length, file).toBeGreaterThanOrEqual(650);
      expect(words.length, file).toBeLessThanOrEqual(750);
    }
  });

  it("does not contain legacy template titles", () => {
    for (const file of files) {
      const { data } = matter(fs.readFileSync(path.join(process.cwd(), "content", "articles", file), "utf8"));
      expect(String(data.title), file).not.toMatch(/word trail/i);
    }
  });

  it("assigns 46-47 unique vocabulary words to every article", () => {
    const assigned = new Set<string>();
    for (const file of files) {
      const { data } = matter(fs.readFileSync(path.join(process.cwd(), "content", "articles", file), "utf8"));
      expect(data.focusWords.length, file).toBeGreaterThanOrEqual(46);
      expect(data.focusWords.length, file).toBeLessThanOrEqual(47);
      for (const word of data.focusWords as string[]) {
        expect(assigned.has(word), `duplicate assignment: ${word}`).toBe(false);
        assigned.add(word);
      }
    }
    expect(assigned.size).toBe(vocabularyData.meta.count);
  });

  it("contains the complete balanced vocabulary baseline", () => {
    expect(vocabularyData.meta.count).toBe(2085);
    expect(vocabularyData.entries.every((entry) => entry.translation.length > 0)).toBe(true);
  });
});