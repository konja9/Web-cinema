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

追跡する作品は `data/tracked-movies.json` に `{ tmdbId, imdbId, slug }` の形で登録する。ここに登録した作品が自動更新・一括更新の対象になる。

### 1. 日本公開の新作を自動発見して追跡対象に追加

```bash
npm run discover:jp
```

TMDbの`/discover/movie`(`region=JP`、劇場公開、過去180日〜未来90日、最大10ページ=200件を走査)から日本公開作品を検出し、IMDb IDが判明した作品だけ`tracked-movies.json`に追加する(既存作品は重複追加しない)。追加後は下記の`fetch:tmdb`を一括実行してメタデータを埋める。

実際に何件ヒットするかは、その時点の日本の劇場公開本数やIMDb ID登録状況に依存するため、特定の件数(例: 100件)への到達を保証するものではない。件数を増やしたい場合は、`scripts/discover-jp-releases.ts`内の`PAST_DAYS`(既定180日)や`MAX_PAGES`(既定10ページ)を調整する。

### 2. TMDbから基本メタデータを取得

```bash
cp .env.example .env.local
# .env.local に TMDB_API_KEY を設定

# 単発実行(1作品だけ)
npm run fetch:tmdb -- <TMDb movie id> <imdb id> <slug>

# 一括実行(data/tracked-movies.json の全件)
npm run fetch:tmdb
```

### 3. IMDbから技術仕様を取得

```bash
# 単発/複数指定
npm run scrape:imdb -- tt1234567 tt7654321

# 一括実行(data/tracked-movies.json の全件)
npm run scrape:imdb
```

複数IDを渡すとまとめて取得できます(3秒間隔でリクエスト)。

**利用上の注意**: IMDbのスクレイピングは利用規約上グレーな行為です。本スクリプトは個人・小規模運用を前提としており、以下を守って利用してください。

- 事前に [IMDbのrobots.txt](https://www.imdb.com/robots.txt) で対象パスが許可されているか確認する
- リクエスト頻度を上げすぎない(デフォルト3秒間隔を変更しない)
- 取得データを商用利用・大規模再配布しない

### 4. 手動でのデータ編集

`data/movies/<imdb id>.json` を直接編集しても構いません。フィールドの定義は `lib/movie-schema.ts` を参照してください。

### 旧作(classic)の掲載基準

新作(`now_showing`/`upcoming`)とは別に、以下いずれかの基準を満たす旧作を `status: "classic"` として掲載する。

- **技術的に特筆すべき作品**(`highlightReason: "technical_highlight"`): 特殊なアスペクト比・撮影フォーマット(70mm、Ultra Panavision 70、IMAXなど)で知られる作品
- **日本でのリバイバル上映作品**(`highlightReason: "revival_screening"`): 実際に日本で再上映された実績のある作品

`classic`作品は`discover:jp`の対象外(新作発見スクリプトのため)。`tracked-movies.json`に手動で追加し、`fetch:tmdb`/`scrape:imdb`でメタデータを取得する。`fetch:tmdb`は`status: "classic"`を公開日による自動判定で上書きしない。

### 5. 自動更新(GitHub Actions)

`.github/workflows/` に2つの定期実行ワークフローがある。

- `update-tmdb.yml`: **毎日**、新作発見(`discover:jp`)→ TMDbの基本メタデータ(公開日・あらすじ・ポスター・公開中/予定ステータス)を自動更新
- `update-imdb-specs.yml`: **毎週月曜**、IMDbの技術仕様(アスペクト比・カメラ等)を自動更新(規約リスクを抑えるため低頻度)

差分があれば `github-actions[bot]` が自動でコミット・pushする。利用には以下の設定が必要。

- リポジトリの Settings → Secrets and variables → Actions で `TMDB_API_KEY` を登録
- Settings → Actions → General → Workflow permissions を「Read and write permissions」に設定(自動コミットのpushに必要)

`workflow_dispatch` にも対応しているため、Actionsタブから手動トリガーもできる。

## ディレクトリ構成

```
app/                          Next.js App Router
  page.tsx                    一覧ページ
  movies/[slug]/page.tsx      詳細ページ
  cameras/page.tsx            カメラ一覧(逆引き)
  cameras/[slug]/page.tsx     カメラ別の作品一覧
  aspect-ratios/page.tsx      アスペクト比一覧(逆引き)
  aspect-ratios/[slug]/page.tsx  アスペクト比別の作品一覧
components/                   UIコンポーネント
data/movies/*.json           作品データ
data/tracked-movies.json     自動更新の追跡対象台帳
lib/movie-schema.ts          データ型定義(zod)
lib/movies.ts                データ読み込み・集計ユーティリティ
lib/slugify.ts                URLスラッグ生成
scripts/                      データ収集スクリプト
```
