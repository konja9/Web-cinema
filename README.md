# Web Cinema

日本で現在公開中・公開予定(一部旧作も含む)の映画について、アスペクト比・カメラなどの撮影技術仕様をすぐに確認できるサイト。

## 技術スタック

- Next.js (App Router) + TypeScript + Tailwind CSS
- データはリポジトリ内の JSON ファイル (`data/movies/*.json`) を正とする
- 基本メタデータ(タイトル・公開日・あらすじ・ポスター)は TMDb API から取得
- 技術仕様(アスペクト比・カメラ等)は IMDb の Technical Specs ページから取得

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 で確認できます。

## データ更新

### 1. TMDbから基本メタデータを取得

```bash
cp .env.example .env.local
# .env.local に TMDB_API_KEY を設定

npm run fetch:tmdb -- <TMDb movie id> <imdb id> <slug>
```

### 2. IMDbから技術仕様を取得

```bash
npm run scrape:imdb -- tt1234567 tt7654321
```

複数IDを渡すとまとめて取得できます(3秒間隔でリクエスト)。

**利用上の注意**: IMDbのスクレイピングは利用規約上グレーな行為です。本スクリプトは個人・小規模運用を前提としており、以下を守って利用してください。

- 事前に [IMDbのrobots.txt](https://www.imdb.com/robots.txt) で対象パスが許可されているか確認する
- リクエスト頻度を上げすぎない(デフォルト3秒間隔を変更しない)
- 取得データを商用利用・大規模再配布しない

### 3. 手動でのデータ編集

`data/movies/<imdb id>.json` を直接編集しても構いません。フィールドの定義は `lib/movie-schema.ts` を参照してください。

## ディレクトリ構成

```
app/                    Next.js App Router
  page.tsx              一覧ページ
  movies/[slug]/page.tsx  詳細ページ
components/              UIコンポーネント
data/movies/*.json      作品データ
lib/movie-schema.ts     データ型定義(zod)
lib/movies.ts           データ読み込みユーティリティ
scripts/                データ収集スクリプト
```
