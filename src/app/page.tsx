import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { getAllArticles } from "@/lib/articles";
import { getCoverage } from "@/lib/coverage";

export default function HomePage() {
  const articles = getAllArticles();
  const coverage = getCoverage();
  const [lead, ...rest] = articles;

  return (
    <main className="home">
      <section className="home-hero">
        <div className="shell home-hero__grid">
          <div>
            <p className="hero-kicker">约 700 词的英语世界漫游</p>
            <h1>
              把六级词汇
              <span>读进真实世界。</span>
            </h1>
            <p className="home-hero__copy">
              不从 A 背到 Z，也不把单词塞进例句里。每篇文章都围绕有趣议题写成，六级词自然出现、加粗、可查，也可以双击收进你的本地单词本。
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href={lead ? `/articles/${lead.slug}` : "/articles"}>
                读一篇
              </Link>
              <Link className="button-secondary" href="/coverage">
                查看词汇地图
              </Link>
            </div>
          </div>

          <aside className="progress-card">
            <div className="progress-card__label">词表覆盖进度</div>
            <div className="progress-card__number">
              {coverage.covered}
              <small> / {coverage.total}</small>
            </div>
            <p>每篇固定承载 46–47 个词条；每个词在全站只高亮一次。</p>
            <div className="progress-track" aria-label={`已覆盖 ${coverage.percentage.toFixed(1)}%`}>
              <span style={{ width: `${coverage.percentage}%` }} />
            </div>
            <Link className="progress-card__link" href="/coverage">
              查看还剩哪些词
            </Link>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Featured route</p>
              <h2>今天从哪一站开始？</h2>
            </div>
            <p>先看主题，再读文章。悬浮任意英文词，或双击把它加入自己的单词本。</p>
          </div>

          {lead ? (
            <div className="featured-grid">
              <ArticleCard article={lead} featured />
              {rest.slice(0, 2).map((article) => (
                <ArticleCard article={article} key={article.slug} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>内容正在装订</h2>
              <p>首批十篇文章写入后，这里会自动出现。</p>
            </div>
          )}
        </div>
      </section>

      {rest.length > 2 ? (
        <section className="section">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="section-kicker">More trails</p>
                <h2>更多阅读路线</h2>
              </div>
              <Link className="text-link" href="/articles">
                浏览全部文章
              </Link>
            </div>
            <div className="article-list">
              {rest.slice(2, 8).map((article) => (
                <ArticleCard article={article} key={article.slug} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}