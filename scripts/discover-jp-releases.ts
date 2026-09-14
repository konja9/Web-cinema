/**
 * TMDbの /discover/movie (region=JP、劇場公開、指定期間) から日本公開作品を
 * 検出し、data/tracked-movies.json に未登録のものだけ追加する。
 *
 * 使い方:
 *   TMDB_API_KEY=xxxx npx tsx scripts/discover-jp-releases.ts
 *
 * 過去 PAST_DAYS 日〜未来 FUTURE_DAYS 日の劇場公開作品(with_release_type=2|3)
 * を対象に、最大 MAX_PAGES ページ(1ページ20件)まで取得する。まとまった
 * 期間を一度に検索するため、1回の実行でも既存の now_playing/upcoming単発
 * 呼び出しより多くの候補を拾える。
 *
 * 追加された作品は tmdbId/imdbId/slug のみが登録される。実際のメタデータは
 * 続けて scripts/fetch-tmdb.ts(一括モード)を実行して取得すること。
 * (GitHub Actionsの毎日ワークフローでは discover → fetch:tmdb の順に実行する)
 *
 * 実際にヒットする件数は日本の劇場公開本数・IMDb ID登録状況に依存するため、
 * 一定件数への到達を保証するものではない。
 */
import fs from "node:fs";
import path from "node:path";
import { slugify } from "../lib/slugify";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TRACKED_MOVIES_PATH = path.join(
  process.cwd(),
  "data",
  "tracked-movies.json",
);

const PAST_DAYS = 180;
const FUTURE_DAYS = 90;
const MAX_PAGES = 10; // 1ページ20件 x 10 = 最大200件の候補を走査
const REQUEST_INTERVAL_MS = 200;

type TrackedMovie = { tmdbId: string; imdbId: string; slug: string };

type TmdbDiscoverResponse = {
  results: Array<{ id: number; original_title: string }>;
  total_pages: number;
};

type TmdbExternalIds = {
  imdb_id: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`TMDb API error: ${res.status} ${res.statusText} (${url})`);
  }
  return res.json() as Promise<T>;
}

async function fetchAllCandidates(): Promise<TmdbDiscoverResponse["results"]> {
  const today = new Date();
  const gte = new Date(today);
  gte.setDate(gte.getDate() - PAST_DAYS);
  const lte = new Date(today);
  lte.setDate(lte.getDate() + FUTURE_DAYS);

  const baseParams = new URLSearchParams({
    region: "JP",
    language: "ja-JP",
    with_release_type: "2|3", // 劇場公開(limited/wide)
    "primary_release_date.gte": formatDate(gte),
    "primary_release_date.lte": formatDate(lte),
    sort_by: "primary_release_date.desc",
  });

  const results: TmdbDiscoverResponse["results"] = [];
  let totalPages = 1;

  for (let page = 1; page <= MAX_PAGES && page <= totalPages; page++) {
    if (page > 1) await sleep(REQUEST_INTERVAL_MS);

    const params = new URLSearchParams(baseParams);
    params.set("page", String(page));
    const data = await fetchJson<TmdbDiscoverResponse>(
      `https://api.themoviedb.org/3/discover/movie?${params.toString()}`,
    );
    results.push(...data.results);
    totalPages = data.total_pages;
    console.log(`discover/movie page ${page}/${totalPages} 取得 (${data.results.length}件)`);
  }

  return results;
}

function uniqueSlug(base: string, existingSlugs: Set<string>, tmdbId: number) {
  const candidate = slugify(base) || `movie-${tmdbId}`;
  if (!existingSlugs.has(candidate)) return candidate;
  return `${candidate}-${tmdbId}`;
}

async function main() {
  if (!TMDB_API_KEY) {
    throw new Error("環境変数 TMDB_API_KEY を設定してください");
  }

  const tracked: TrackedMovie[] = fs.existsSync(TRACKED_MOVIES_PATH)
    ? JSON.parse(fs.readFileSync(TRACKED_MOVIES_PATH, "utf-8"))
    : [];
  const knownTmdbIds = new Set(tracked.map((m) => m.tmdbId));
  const existingSlugs = new Set(tracked.map((m) => m.slug));

  const candidates = await fetchAllCandidates();
  const newCandidates = candidates.filter(
    (movie) => !knownTmdbIds.has(String(movie.id)),
  );

  console.log(
    `候補 ${candidates.length}件中、未登録 ${newCandidates.length}件を処理します`,
  );

  const added: TrackedMovie[] = [];
  let skippedNoImdbId = 0;

  for (const [index, candidate] of newCandidates.entries()) {
    if (knownTmdbIds.has(String(candidate.id))) continue; // 同バッチ内の重複対策
    if (index > 0) await sleep(REQUEST_INTERVAL_MS);

    const externalIds = await fetchJson<TmdbExternalIds>(
      `https://api.themoviedb.org/3/movie/${candidate.id}/external_ids`,
    );
    if (!externalIds.imdb_id) {
      skippedNoImdbId += 1;
      console.log(
        `スキップ(IMDb IDなし): ${candidate.original_title} (tmdb:${candidate.id})`,
      );
      continue;
    }

    const slug = uniqueSlug(
      candidate.original_title,
      existingSlugs,
      candidate.id,
    );
    existingSlugs.add(slug);
    knownTmdbIds.add(String(candidate.id));

    const entry: TrackedMovie = {
      tmdbId: String(candidate.id),
      imdbId: externalIds.imdb_id,
      slug,
    };
    tracked.push(entry);
    added.push(entry);
    console.log(`追加: ${candidate.original_title} (${entry.slug})`);
  }

  console.log(
    `--- サマリ: 候補${candidates.length}件 / 追加${added.length}件 / IMDb IDなしでスキップ${skippedNoImdbId}件 / 追跡総数${tracked.length}件 ---`,
  );

  if (added.length === 0) {
    console.log("新規追加はありませんでした");
    return;
  }

  fs.writeFileSync(
    TRACKED_MOVIES_PATH,
    JSON.stringify(tracked, null, 2) + "\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
