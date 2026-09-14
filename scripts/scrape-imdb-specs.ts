/**
 * IMDbのTechnical Specsページ (https://www.imdb.com/title/<id>/technical/)
 * からアスペクト比・カメラ等の技術仕様を取得し、data/movies/<id>.json にマージする。
 *
 * 注意事項(必読):
 * - IMDbの利用規約上、自動スクレイピングはグレーゾーンのリスクを伴う。
 *   本スクリプトは個人・小規模運用の範囲での利用を想定し、以下を必ず守ること。
 *   1. 事前に https://www.imdb.com/robots.txt を確認し、対象パスが許可されているか確認する
 *   2. リクエスト間隔を空ける(本スクリプトはデフォルトで3秒間隔)
 *   3. User-Agentを明示し、過度なリクエストを行わない
 *   4. 商用利用・大規模配信を行わない
 *
 * 使い方:
 *   npx tsx scripts/scrape-imdb-specs.ts tt1234567 tt7654321
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const MOVIES_DIR = path.join(process.cwd(), "data", "movies");
const REQUEST_INTERVAL_MS = 3000;
const USER_AGENT =
  "web-cinema-spec-bot/0.1 (personal, non-commercial data collection; contact: set-your-contact-here)";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ScrapedSpecs = {
  aspectRatio?: string;
  camera?: string[];
  negativeFormat?: string;
  printedFilmFormat?: string;
  cinematographicProcess?: string;
};

async function scrapeTechnicalSpecs(imdbId: string): Promise<ScrapedSpecs> {
  const url = `https://www.imdb.com/title/${imdbId}/technical/`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US" },
  });
  if (!res.ok) {
    throw new Error(`IMDb取得失敗 (${res.status}): ${url}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const specs: ScrapedSpecs = {};

  // IMDbのTechnical Specsページは li[data-testid="title-techspec_xxx"] 構造
  // (ページ構造は変更される可能性があるため、取得できなかった項目は undefined のままにする)
  const getRowText = (testId: string) =>
    $(`li[data-testid="${testId}"]`)
      .find(".ipc-metadata-list-item__content-container")
      .text()
      .trim() || undefined;

  specs.aspectRatio = getRowText("title-techspec_aspectratio");
  specs.negativeFormat = getRowText("title-techspec_negativeformat");
  specs.printedFilmFormat = getRowText("title-techspec_printedfilmformat");
  specs.cinematographicProcess = getRowText(
    "title-techspec_cinematographicprocess",
  );

  const cameraText = $('li[data-testid="title-techspec_camera"]')
    .find(".ipc-metadata-list-item__content-container li")
    .map((_, el) => $(el).text().trim())
    .get();
  if (cameraText.length > 0) {
    specs.camera = cameraText;
  }

  return specs;
}

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    throw new Error(
      "使い方: npx tsx scripts/scrape-imdb-specs.ts tt1234567 [tt7654321 ...]",
    );
  }

  for (const [index, imdbId] of ids.entries()) {
    if (index > 0) await sleep(REQUEST_INTERVAL_MS);

    console.log(`取得中: ${imdbId}`);
    const specs = await scrapeTechnicalSpecs(imdbId);

    const filePath = path.join(MOVIES_DIR, `${imdbId}.json`);
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : {
          id: imdbId,
          slug: imdbId,
          titleJa: "",
          titleOriginal: "",
          releaseDateJapan: "",
          status: "upcoming",
          sourceUrls: { imdb: `https://www.imdb.com/title/${imdbId}/technical/` },
        };

    const updated = {
      ...existing,
      technicalSpecs: { ...existing.technicalSpecs, ...specs },
      lastUpdated: new Date().toISOString(),
    };

    fs.mkdirSync(MOVIES_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n");
    console.log(`更新しました: ${filePath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
