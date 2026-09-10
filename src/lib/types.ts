export type ArticleCategory =
  | "technology"
  | "science"
  | "internet"
  | "mind"
  | "curiosity";

export interface VocabularyEntry {
  id: string;
  lemma: string;
  display: string;
  phonetic: string;
  partOfSpeech: string[];
  translation: string;
  aliases: string[];
  sourceOrder: number;
  exchange: string;
}

export interface SourceLink {
  title: string;
  url: string;
  publication: string;
  accessedAt: string;
}

export interface ArticleFrontmatter {
  slug: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  publishedAt: string;
  reviewedAt: string;
  focusWords: string[];
  tags: string[];
  accent: number;
  sources: SourceLink[];
}

export interface Article extends ArticleFrontmatter {
  body: string;
  wordCount: number;
  readingMinutes: number;
  vocabulary: VocabularyEntry[];
}

export interface SavedOccurrence {
  articleSlug: string;
  articleTitle: string;
  sentence: string;
  savedAt: string;
}

export interface SavedWord {
  lemma: string;
  display: string;
  phonetic: string;
  partOfSpeech: string[];
  translation: string;
  isSyllabus: boolean;
  sourceId?: string;
  occurrences: SavedOccurrence[];
  updatedAt: string;
}

export interface WordbookState {
  version: 1;
  words: SavedWord[];
}

export interface DictionaryRecord {
  word: string;
  lemma: string;
  phonetic: string;
  translation: string;
  partOfSpeech: string[];
  sourceId?: string;
}