import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCameras, getMoviesByCameraSlug } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";

export function generateStaticParams() {
  return getAllCameras().map((camera) => ({ slug: camera.slug }));
}

export default async function CameraDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cameras = getAllCameras();
  const camera = cameras.find((c) => c.slug === slug);
  const movies = getMoviesByCameraSlug(slug);

  if (!camera || movies.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <Link
        href="/cameras"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← カメラ一覧に戻る
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {camera.value}
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        このカメラを使用した作品: {movies.length}件
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
