import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMovies, getMovieBySlug } from "@/lib/movies";
import { slugify } from "@/lib/slugify";

const statusLabel = {
  now_showing: "公開中",
  upcoming: "公開予定",
} as const;

export function generateStaticParams() {
  return getAllMovies().map((movie) => ({ slug: movie.slug }));
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const movie = getMovieBySlug(slug);

  if (!movie) {
    notFound();
  }

  const specs = movie.technicalSpecs;
  const plainSpecRows: Array<[string, string | undefined]> = [
    ["ネガフォーマット", specs.negativeFormat],
    ["上映フォーマット", specs.printedFilmFormat],
    ["撮影プロセス", specs.cinematographicProcess],
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← 一覧に戻る
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row">
        <div className="relative h-72 w-48 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={`${movie.titleJa}のポスター`}
              fill
              sizes="192px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
              No Image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {statusLabel[movie.status]}
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {movie.titleJa}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {movie.titleOriginal}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            日本公開日: {movie.releaseDateJapan}
          </p>
        </div>
      </header>

      {movie.overview && (
        <p className="text-zinc-700 dark:text-zinc-300">{movie.overview}</p>
      )}

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          技術仕様
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              アスペクト比
            </dt>
            <dd className="text-sm text-zinc-800 dark:text-zinc-200">
              {specs.aspectRatio ? (
                <Link
                  href={`/aspect-ratios/${slugify(specs.aspectRatio)}`}
                  className="underline decoration-dotted underline-offset-2 hover:text-zinc-950 dark:hover:text-zinc-50"
                >
                  {specs.aspectRatio}
                </Link>
              ) : (
                "情報なし"
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              カメラ
            </dt>
            <dd className="text-sm text-zinc-800 dark:text-zinc-200">
              {specs.camera && specs.camera.length > 0 ? (
                <span className="flex flex-wrap gap-x-1">
                  {specs.camera.map((camera, index) => (
                    <span key={camera}>
                      <Link
                        href={`/cameras/${slugify(camera)}`}
                        className="underline decoration-dotted underline-offset-2 hover:text-zinc-950 dark:hover:text-zinc-50"
                      >
                        {camera}
                      </Link>
                      {index < specs.camera!.length - 1 && " / "}
                    </span>
                  ))}
                </span>
              ) : (
                "情報なし"
              )}
            </dd>
          </div>
          {plainSpecRows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="text-sm text-zinc-800 dark:text-zinc-200">
                {value ?? "情報なし"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          出典:{" "}
          <a
            href={movie.sourceUrls.imdb}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            IMDb Technical Specs
          </a>
          {movie.sourceUrls.tmdb && (
            <>
              {" / "}
              <a
                href={movie.sourceUrls.tmdb}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                TMDb
              </a>
            </>
          )}
        </p>
        <p>最終更新: {movie.lastUpdated}</p>
      </section>
    </div>
  );
}
