import type { Metadata } from "next";
import { ArticleExplorer } from "@/components/article-explorer";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "全部文章",
  description: "按科技、科学自然、互联网文化、心理生活和奇闻故事浏览六级英文阅读。",
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <main>
      <section className="page-hero">
        <div className="shell">
          <p className="section-kicker">Reading routes</p>
          <h1>不是词汇书，是一张可以读的路线图。</h1>
          <p>每篇文章控制在 650–750 个英文单词，并把当篇六级词列在阅读前。支持搜索标题、主题和单词。</p>
        </div>
      </section>
      <section className="wordbook-layout">
        <div className="shell">
          <ArticleExplorer articles={articles} />
        </div>
      </section>
    </main>
  );
}