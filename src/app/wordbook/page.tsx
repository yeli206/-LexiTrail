import type { Metadata } from "next";
import { WordbookClient } from "@/components/wordbook-client";

export const metadata: Metadata = {
  title: "我的单词本",
  description: "保存文章中的任意英文词与原句，导出 JSON 或 CSV 备份。",
};

export default function WordbookPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="shell">
          <p className="section-kicker">Local wordbook</p>
          <h1>只属于这台设备的单词本。</h1>
          <p>双击文章中的任意英文词即可收藏。数据只保存在浏览器 localStorage，不上传、不登录，可随时导出备份。</p>
        </div>
      </section>
      <section className="wordbook-layout">
        <div className="shell">
          <WordbookClient />
        </div>
      </section>
    </main>
  );
}