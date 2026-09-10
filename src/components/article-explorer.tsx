"use client";

import { useMemo, useState } from "react";
import type { Article, ArticleCategory } from "@/lib/types";
import { categoryLabels } from "@/lib/categories";
import { ArticleCard } from "@/components/article-card";

export function ArticleExplorer({ articles }: { articles: Article[] }) {
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch = category === "all" || article.category === category;
      const queryMatch =
        !normalized ||
        article.title.toLowerCase().includes(normalized) ||
        article.summary.toLowerCase().includes(normalized) ||
        article.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
        article.vocabulary.some((entry) => entry.display.toLowerCase().includes(normalized));
      return categoryMatch && queryMatch;
    });
  }, [articles, category, query]);

  return (
    <>
      <div className="toolbar">
        <input
          className="search-field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标题、主题或单词"
          aria-label="搜索文章"
        />
      </div>
      <div className="category-strip" aria-label="文章分类">
        <button type="button" className="category-pill" data-active={category === "all"} onClick={() => setCategory("all")}>
          全部
        </button>
        {(Object.keys(categoryLabels) as ArticleCategory[]).map((key) => (
          <button
            type="button"
            className="category-pill"
            data-active={category === key}
            key={key}
            onClick={() => setCategory(key)}
          >
            {categoryLabels[key]}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <div className="article-list">
          {filtered.map((article) => (
            <ArticleCard article={article} key={article.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>没有匹配的文章</h2>
          <p>试试更短的关键词，或切回“全部”分类。</p>
        </div>
      )}
    </>
  );
}