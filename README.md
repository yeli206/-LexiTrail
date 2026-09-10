# 词途 LexiTrail

用约 700 词的趣味英文文章覆盖六级词汇。每篇文章在正文前列出本篇词汇，所有英文词支持悬浮查询和双击收藏，六级词自动加粗，并在词汇地图中计算首次出现位置。

## 当前内容

- 2,085 个规范词条，来自用户提供的第三方《大学英语六级词汇乱序版》
- 首批 10 篇文章，正文 650-750 词
- 本地 ECDICT 词典，无运行时 API 和密钥
- 单词本保存在浏览器 `localStorage`
- Next.js 16 App Router，静态生成并部署到 Vercel

词表不是官方大纲原件，页面和免责声明中均明确标注为第三方资料。

## 开发

```bash
pnpm install
pnpm dev
```

检查：

```bash
pnpm lint
pnpm typecheck
pnpm content:validate
pnpm test
pnpm test:e2e
pnpm build
```

## 数据更新

原始 PDF 与 ECDICT 大文件位于 `.cache/`，不会提交到 GitHub。生成流程和文章规范见 `content/AUTHORING.md`。

## 部署

仓库推送到 `main` 后，在 Vercel 中导入 GitHub 仓库。项目不需要环境变量或数据库；Vercel 会自动识别 Next.js 并部署。若配置自定义站点域名，可设置 `NEXT_PUBLIC_SITE_URL` 以生成正确的 sitemap 和 canonical URL。