import type { Metadata } from "next";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: {
    default: "词途 LexiTrail｜把六级词汇读进真实世界",
    template: "%s｜词途 LexiTrail",
  },
  description: "用约 700 词的趣味英文文章覆盖整套用户提供的六级乱序词表。所有单词可查、可收藏、可追踪。",
  keywords: ["六级词汇", "CET-6", "英语阅读", "单词本", "词途", "LexiTrail"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "词途 LexiTrail",
    title: "词途 LexiTrail｜把六级词汇读进真实世界",
    description: "用有趣文章记住六级词汇，并在词汇地图中看见自己的进度。",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" className={`${display.variable} ${serif.variable}`}>
      <body>
        <ToastProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}