"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArticleCover } from "@/components/article-cover";
import { ReadToggle } from "@/components/read-toggle";
import { useReading } from "@/hooks/use-reading";
import { categoryLabels } from "@/lib/categories";
import type { Article, ArticleCategory } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ArticleExplorer({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const reading = useReading();
  const ordered = useMemo(() => [...articles].sort((a, b) => a.number - b.number), [articles]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ordered.filter((article) => {
      const categoryMatch = category === "all" || article.category === category;
      const queryMatch =
        !normalized ||
        article.title.toLowerCase().includes(normalized) ||
        article.summary.toLowerCase().includes(normalized) ||
        article.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
        article.vocabulary.some((entry) => entry.display.toLowerCase().includes(normalized));
      return categoryMatch && queryMatch;
    });
  }, [category, ordered, query]);

  const groups = (Object.keys(categoryLabels) as ArticleCategory[])
    .map((key) => ({ key, label: categoryLabels[key], items: filtered.filter((article) => article.category === key) }))
    .filter((group) => group.items.length > 0);
  const completed = ordered.filter((article) => reading.completed[article.slug]).length;

  return (
    <>
      <div className="catalogue-summary">
        <div>
          <span>本机阅读进度</span>
          <strong>{completed} / {ordered.length}</strong>
        </div>
        <div className="progress-track" aria-label={`已读 ${completed} 篇`}>
          <span style={{ width: `${ordered.length ? (completed / ordered.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索编号、标题、主题或单词"
          aria-label="搜索文章"
        />
      </div>

      <div className="category-strip" aria-label="文章栏目">
        <button type="button" className="category-pill" data-active={category === "all"} onClick={() => setCategory("all")}>
          全部栏目
        </button>
        {(Object.keys(categoryLabels) as ArticleCategory[]).map((key) => (
          <button type="button" className="category-pill" data-active={category === key} key={key} onClick={() => setCategory(key)}>
            {categoryLabels[key]} · {ordered.filter((article) => article.category === key).length}
          </button>
        ))}
      </div>

      {groups.length ? (
        <div className="catalogue-sections">
          {groups.map((group) => {
            const groupCompleted = group.items.filter((article) => reading.completed[article.slug]).length;
            return (
              <section className="catalogue-section" key={group.key}>
                <div className="catalogue-section__head">
                  <h2>{group.label}</h2>
                  <span>{groupCompleted} / {group.items.length} 已读</span>
                </div>
                <div className="catalogue-list">
                  {group.items.map((article) => (
                    <article className="catalogue-item" key={article.slug}>
                      <Link className="catalogue-item__cover" href={`/articles/${article.slug}`} aria-label={article.title}>
                        <ArticleCover title={article.title} seed={article.accent} number={article.number} compact />
                      </Link>
                      <div className="catalogue-item__number">#{String(article.number).padStart(2, "0")}</div>
                      <div className="catalogue-item__body">
                        <div className="article-card__meta">
                          <span>{formatDate(article.publishedAt)}</span>
                          <span>{article.wordCount} words</span>
                          <span>{article.vocabulary.length} 个六级词</span>
                        </div>
                        <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
                        <p>{article.summary}</p>
                      </div>
                      <ReadToggle slug={article.slug} compact />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>没有匹配的文章</h2>
          <p>试试更短的关键词，或切回“全部栏目”。</p>
        </div>
      )}
    </>
  );
}