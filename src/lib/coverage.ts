import { getAllArticles } from "@/lib/articles";
import { vocabulary } from "@/lib/vocabulary";

export interface CoverageRecord {
  lemma: string;
  articleSlug: string;
  articleTitle: string;
}

export function getCoverage() {
  const coverage = new Map<string, CoverageRecord>();
  for (const article of getAllArticles()) {
    for (const entry of article.vocabulary) {
      if (!coverage.has(entry.lemma)) {
        coverage.set(entry.lemma, {
          lemma: entry.lemma,
          articleSlug: article.slug,
          articleTitle: article.title,
        });
      }
    }
  }

  const covered = vocabulary.filter((entry) => coverage.has(entry.lemma)).length;
  return {
    total: vocabulary.length,
    covered,
    remaining: vocabulary.length - covered,
    percentage: vocabulary.length ? (covered / vocabulary.length) * 100 : 0,
    records: Object.fromEntries(coverage),
  };
}