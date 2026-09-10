import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { z } from "zod";
import type { Article, VocabularyEntry } from "@/lib/types";
import { findVocabularyMatches, getVocabularyEntry } from "@/lib/vocabulary";

const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  publication: z.string().min(2),
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const frontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(8),
  summary: z.string().min(20),
  category: z.enum(["technology", "science", "internet", "mind", "curiosity"]),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  focusWords: z.array(z.string()).min(35).max(45),
  tags: z.array(z.string()).min(2).max(5),
  accent: z.number().int().min(0).max(359),
  sources: z.array(sourceSchema).min(3).max(5),
});

const CONTENT_DIRECTORY = path.join(process.cwd(), "content", "articles");

function countEnglishWords(text: string) {
  return (text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g) ?? []).length;
}

function parseArticleFile(filePath: string): Article {
  const file = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(file);
  const frontmatter = frontmatterSchema.parse(data);
  const body = content.trim();
  const wordCount = countEnglishWords(body);
  const vocabulary = findVocabularyMatches(body);

  for (const focusWord of frontmatter.focusWords) {
    const entry = getVocabularyEntry(focusWord);
    if (!entry) {
      throw new Error(`Unknown focus word "${focusWord}" in ${frontmatter.slug}`);
    }
    if (!vocabulary.some((candidate) => candidate.id === entry.id)) {
      throw new Error(`Focus word "${focusWord}" does not occur in ${frontmatter.slug}`);
    }
  }

  return {
    ...frontmatter,
    body,
    wordCount,
    readingMinutes: Math.max(3, Math.round(wordCount / 210)),
    vocabulary,
  };
}

export const getAllArticles = cache((): Article[] => {
  if (!fs.existsSync(CONTENT_DIRECTORY)) return [];
  return fs
    .readdirSync(CONTENT_DIRECTORY)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parseArticleFile(path.join(CONTENT_DIRECTORY, file)))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
});

export const getArticle = cache((slug: string) => {
  return getAllArticles().find((article) => article.slug === slug) ?? null;
});

export function getArticleVocabulary(article: Article): VocabularyEntry[] {
  return article.vocabulary;
}

export function getAdjacentArticles(slug: string) {
  const articles = getAllArticles();
  const index = articles.findIndex((article) => article.slug === slug);
  return {
    newer: index > 0 ? articles[index - 1] : null,
    older: index >= 0 && index < articles.length - 1 ? articles[index + 1] : null,
  };
}
