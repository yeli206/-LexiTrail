import Link from "next/link";
import type { Article } from "@/lib/types";
import { categoryLabels } from "@/lib/categories";
import { formatDate } from "@/lib/utils";
import { ArticleCover } from "@/components/article-cover";

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <article className={featured ? "article-card article-card--featured" : "article-card"}>
      <Link href={`/articles/${article.slug}`} className="article-card__cover-link" aria-label={article.title}>
        <ArticleCover title={article.title} seed={article.accent} compact={!featured} />
      </Link>
      <div className="article-card__body">
        <div className="article-card__meta">
          <span>{categoryLabels[article.category]}</span>
          <span>{formatDate(article.publishedAt)}</span>
          <span>{article.wordCount} words</span>
        </div>
        <h2>
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h2>
        <p>{article.summary}</p>
        <div className="article-card__footer">
          <span>{article.vocabulary.length} 个六级词</span>
          <Link href={`/articles/${article.slug}`} className="text-link">
            开始阅读
          </Link>
        </div>
      </div>
    </article>
  );
}