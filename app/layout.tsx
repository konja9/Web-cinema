import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "日本公開映画 技術仕様データベース",
  description:
    "日本で公開中・公開予定の映画のアスペクト比・カメラなどの技術仕様を一覧できるサイト",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </footer>
      </body>
    </html>
  );
}
