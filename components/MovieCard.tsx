import Link from "next/link";
import type { Movie } from "@/lib/movie-schema";

const statusLabel: Record<Movie["status"], string> = {
  now_showing: "公開中",
  upcoming: "公開予定",
};

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {statusLabel[movie.status]}
      </span>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {movie.titleJa}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {movie.titleOriginal}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        公開日: {movie.releaseDateJapan}
      </p>
      {movie.technicalSpecs.aspectRatio && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          アスペクト比: {movie.technicalSpecs.aspectRatio}
        </p>
      )}
    </Link>
  );
}
