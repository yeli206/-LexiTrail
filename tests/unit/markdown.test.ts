import { describe, expect, it } from "vitest";
import { renderArticleBody } from "@/lib/markdown";
import { getVocabularyEntry } from "@/lib/vocabulary";

describe("article rendering", () => {
  it("wraps every English token and highlights assigned words only once", async () => {
    const vocabulary = ["unique", "optimum", "unique"].map((word) => getVocabularyEntry(word)!).filter(Boolean);
    const html = await renderArticleBody("A unique idea remains unique, while an optimum route stays optimum.", vocabulary);
    expect(html).toContain("data-word=\"A\"");
    expect(html).toContain("data-word=\"unique\"");
    expect((html.match(/word-target/g) ?? []).length).toBe(2);
    expect(html).toContain("data-source-id=\"w0455\"");
  });
});
