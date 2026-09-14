/**
 * TMDbの now_playing / upcoming (region=JP) から日本公開の新作を検出し、
 * data/tracked-movies.json に未登録のものだけ追加する。
 *
 * 使い方:
 *   TMDB_API_KEY=xxxx npx tsx scripts/discover-jp-releases.ts
 *
 * 追加された作品は tmdbId/imdbId/slug のみが登録される。実際のメタデータは
 * 続けて scripts/fetch-tmdb.ts(一括モード)を実行して取得すること。
 * (GitHub Actionsの毎日ワークフローでは discover → fetch:tmdb の順に実行する)
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

type TrackedMovie = { tmdbId: string; imdbId: string; slug: string };

type TmdbListResponse = {
  results: Array<{ id: number; original_title: string }>;
  total_pages: number;
};

type TmdbExternalIds = {
  imdb_id: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`TMDb API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function fetchCandidates(
  endpoint: "now_playing" | "upcoming",
): Promise<TmdbListResponse["results"]> {
  const data = await fetchJson<TmdbListResponse>(
    `https://api.themoviedb.org/3/movie/${endpoint}?region=JP&language=ja-JP&page=1`,
  );
  return data.results;
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

  const [nowPlaying, upcoming] = await Promise.all([
    fetchCandidates("now_playing"),
    fetchCandidates("upcoming"),
  ]);

  const candidates = [...nowPlaying, ...upcoming].filter(
    (movie) => !knownTmdbIds.has(String(movie.id)),
  );

  const added: TrackedMovie[] = [];

  for (const candidate of candidates) {
    if (knownTmdbIds.has(String(candidate.id))) continue; // 同バッチ内の重複対策

    const externalIds = await fetchJson<TmdbExternalIds>(
      `https://api.themoviedb.org/3/movie/${candidate.id}/external_ids`,
    );
    if (!externalIds.imdb_id) {
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

  if (added.length === 0) {
    console.log("新規追加はありませんでした");
    return;
  }

  fs.writeFileSync(
    TRACKED_MOVIES_PATH,
    JSON.stringify(tracked, null, 2) + "\n",
  );
  console.log(`${added.length}件を追加しました`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
