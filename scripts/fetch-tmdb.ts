/**
 * TMDb API から基本メタデータ(タイトル・公開日・あらすじ・ポスター)を取得し、
 * data/movies/<imdbId>.json の該当フィールドをマージ更新する。
 *
 * 使い方:
 *   単発実行:   TMDB_API_KEY=xxxx npx tsx scripts/fetch-tmdb.ts <TMDb movie id> <imdb id> <slug>
 *   一括実行:   TMDB_API_KEY=xxxx npx tsx scripts/fetch-tmdb.ts
 *              (引数なしの場合、data/tracked-movies.json の全件を処理する。
 *               GitHub Actionsの毎日自動更新はこのモードを使う)
 *
 * 技術仕様(アスペクト比・カメラ等)はTMDbには存在しないため、
 * scripts/scrape-imdb-specs.ts で別途取得する。
 */
import fs from "node:fs";
import path from "node:path";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const MOVIES_DIR = path.join(process.cwd(), "data", "movies");
const TRACKED_MOVIES_PATH = path.join(
  process.cwd(),
  "data",
  "tracked-movies.json",
);

type TrackedMovie = { tmdbId: string; imdbId: string; slug: string };

type TmdbMovie = {
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  imdb_id: string | null;
};

type TmdbReleaseDates = {
  results: Array<{
    iso_3166_1: string;
    release_dates: Array<{ release_date: string; type: number }>;
  }>;
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

function getJapanReleaseDate(data: TmdbReleaseDates, fallback: string) {
  const jp = data.results.find((r) => r.iso_3166_1 === "JP");
  const theatrical = jp?.release_dates.find((r) => r.type === 3 || r.type === 2);
  return theatrical?.release_date.slice(0, 10) ?? fallback;
}

async function updateMovie({ tmdbId, imdbId, slug }: TrackedMovie) {
  const movie = await fetchJson<TmdbMovie>(
    `https://api.themoviedb.org/3/movie/${tmdbId}?language=ja-JP`,
  );
  const releaseDates = await fetchJson<TmdbReleaseDates>(
    `https://api.themoviedb.org/3/movie/${tmdbId}/release_dates`,
  );

  const filePath = path.join(MOVIES_DIR, `${imdbId}.json`);
  const existing = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
    : {};

  const releaseDateJapan = getJapanReleaseDate(
    releaseDates,
    movie.release_date,
  );
  const isFuture = new Date(releaseDateJapan) > new Date();

  const updated = {
    ...existing,
    id: imdbId,
    slug,
    titleJa: movie.title,
    titleOriginal: movie.original_title,
    releaseDateJapan,
    posterUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : existing.posterUrl,
    overview: movie.overview || existing.overview,
    status: isFuture ? "upcoming" : "now_showing",
    technicalSpecs: existing.technicalSpecs ?? {},
    sourceUrls: {
      imdb: `https://www.imdb.com/title/${imdbId}/technical/`,
      tmdb: `https://www.themoviedb.org/movie/${tmdbId}`,
    },
    lastUpdated: new Date().toISOString(),
  };

  fs.mkdirSync(MOVIES_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n");
  console.log(`更新しました: ${filePath}`);
}

async function main() {
  if (!TMDB_API_KEY) {
    throw new Error("環境変数 TMDB_API_KEY を設定してください");
  }

  const [tmdbId, imdbId, slug] = process.argv.slice(2);

  if (tmdbId && imdbId && slug) {
    await updateMovie({ tmdbId, imdbId, slug });
    return;
  }

  if (tmdbId || imdbId || slug) {
    throw new Error(
      "使い方: npx tsx scripts/fetch-tmdb.ts <TMDb movie id> <imdb id> <slug>\n" +
        "(引数を省略した場合は data/tracked-movies.json の全件を処理します)",
    );
  }

  if (!fs.existsSync(TRACKED_MOVIES_PATH)) {
    throw new Error(`追跡対象リストが見つかりません: ${TRACKED_MOVIES_PATH}`);
  }
  const tracked: TrackedMovie[] = JSON.parse(
    fs.readFileSync(TRACKED_MOVIES_PATH, "utf-8"),
  );

  for (const entry of tracked) {
    await updateMovie(entry);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
