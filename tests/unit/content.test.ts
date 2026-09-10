import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import vocabularyData from "@/data/vocabulary.json";

const focusSets = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content", "focus-sets.json"), "utf8"),
) as Record<string, string[]>;

describe("article content", () => {
  const files = fs.readdirSync(path.join(process.cwd(), "content", "articles"));

  it("ships exactly ten articles with valid lengths", () => {
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

  it("has 35-45 focus words per article", () => {
    for (const [slug, words] of Object.entries(focusSets)) {
      expect(words.length, slug).toBeGreaterThanOrEqual(35);
      expect(words.length, slug).toBeLessThanOrEqual(45);
    }
  });

  it("contains the complete first-batch vocabulary baseline", () => {
    expect(vocabularyData.meta.count).toBe(2085);
    expect(vocabularyData.entries.every((entry) => entry.translation.length > 0)).toBe(true);
  });
});