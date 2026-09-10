import { describe, expect, it } from "vitest";
import { renderArticleBody } from "@/lib/markdown";

describe("article rendering", () => {
  it("marks every English token and gives syllabus words a target class", async () => {
    const html = await renderArticleBody("A **unique** thought can reveal an **optimum** route.");
    expect(html).toContain('data-word="A"');
    expect(html).toContain('data-word="unique"');
    expect(html).toContain('class="word-token word-target"');
    expect(html).toContain('data-source-id="w0455"');
  });
});