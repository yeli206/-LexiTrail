import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCover } from "@/components/article-cover";
import { InteractiveArticle } from "@/components/interactive-article";
import { ReadingProgress } from "@/components/reading-progress";
import { ReadToggle } from "@/components/read-toggle";
import { VocabularyPreview } from "@/components/vocabulary-preview";
import { getAllArticles, getAdjacentArticles, getArticle } from "@/lib/articles";
import { categoryLabels } from "@/lib/categories";
import { renderArticleBody } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "文章未找到" };
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      publishedTime: article.publishedAt,
      modifiedTime: article.reviewedAt,
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const html = await renderArticleBody(article.body, article.vocabulary);
  const { newer, older } = getAdjacentArticles(article.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.reviewedAt,
    inLanguage: "en",
    author: { "@type": "Organization", name: "LexiTrail" },
  };

  return (
    <main>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <header className="reader-head">
          <div className="reader-shell">
            <div className="reader-head__meta">
              <span>第 {article.number} 篇</span>
              <Link href="/articles">{categoryLabels[article.category]}</Link>
              <span>{formatDate(article.publishedAt)}</span>
              <span>{article.wordCount} words</span>
              <span>约 {article.readingMinutes} 分钟</span>
              <ReadToggle slug={article.slug} />
            </div>
            <h1>{article.title}</h1>
            <p className="reader-head__summary">{article.summary}</p>
          </div>
        </header>

        <div className="reader-shell">
          <ArticleCover title={article.title} seed={article.accent} number={article.number} className="article-banner" />
        </div>

        <div className="reader-shell reader-grid">
          <InteractiveArticle html={html} articleSlug={article.slug} articleTitle={article.title} />
          <div>
            <VocabularyPreview entries={article.vocabulary} />
            <section className="sources">
              <h2>事实来源</h2>
              <ol>
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <span> · {source.publication} · {source.accessedAt}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </article>

      {newer || older ? (
        <section className="reader-next">
          <div className="reader-shell reader-next__grid">
            {newer ? (
              <Link href={`/articles/${newer.slug}`}>
                <span>上一篇</span>
                <strong>{newer.title}</strong>
              </Link>
            ) : <span />}
            {older ? (
              <Link href={`/articles/${older.slug}`}>
                <span>下一篇</span>
                <strong>{older.title}</strong>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}