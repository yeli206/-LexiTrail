import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <h1>404</h1>
        <p>这条路还没有文章。回到词汇地图，换一条路线继续走。</p>
        <Link className="button-primary" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}