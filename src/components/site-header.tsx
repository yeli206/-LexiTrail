import Link from "next/link";
import { WordbookCount } from "@/components/wordbook-count";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand" aria-label="词途 LexiTrail 首页">
          <span className="brand__cn">词途</span>
          <span className="brand__en">LexiTrail</span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          <Link href="/articles">文章</Link>
          <Link href="/coverage">词汇地图</Link>
          <Link href="/wordbook">
            单词本 <WordbookCount />
          </Link>
        </nav>
      </div>
    </header>
  );
}