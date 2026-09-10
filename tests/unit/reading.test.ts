import { beforeEach, describe, expect, it } from "vitest";
import { clearReadingProgress, getReadingSnapshot, hydrateReading, toggleRead } from "@/lib/reading-store";

describe("reading progress", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearReadingProgress();
    hydrateReading();
  });

  it("toggles completion locally", () => {
    toggleRead("article-one");
    expect(getReadingSnapshot().completed["article-one"]).toBeTruthy();
    toggleRead("article-one");
    expect(getReadingSnapshot().completed["article-one"]).toBeUndefined();
  });
});