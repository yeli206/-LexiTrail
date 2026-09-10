import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <div className="brand brand--footer">
            <span className="brand__cn">词途</span>
            <span className="brand__en">LexiTrail</span>
          </div>
          <p>把词汇放进故事里，让记忆有路可循。</p>
        </div>
        <div>
          <p className="footer-label">词表来源</p>
          <p>用户提供的第三方《大学英语六级词汇乱序版》，非官方大纲原件。</p>
        </div>
        <div>
          <p className="footer-label">词典数据</p>
          <p>
            ECDICT（MIT License）·{" "}
            <Link href="/licenses/ECDICT.txt">许可文本</Link>
          </p>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <span>© {new Date().getFullYear()} LexiTrail</span>
        <span>本地收藏不会上传</span>
      </div>
    </footer>
  );
}