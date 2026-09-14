import Link from "next/link";
import { getAllMovies } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";

export default function Home() {
  const movies = getAllMovies();
  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const upcoming = movies.filter((m) => m.status === "upcoming");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          日本公開映画 技術仕様データベース
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          日本で公開中・公開予定の作品のアスペクト比・カメラなどの撮影技術仕様を一覧できます。
        </p>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/cameras"
            className="underline decoration-dotted underline-offset-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            カメラから探す
          </Link>
          <Link
            href="/aspect-ratios"
            className="underline decoration-dotted underline-offset-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            アスペクト比から探す
          </Link>
        </nav>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          公開中
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {nowShowing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          公開予定
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {upcoming.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
}
