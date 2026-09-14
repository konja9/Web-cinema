import Link from "next/link";
import { getAllAspectRatios } from "@/lib/movies";

export default function AspectRatiosPage() {
  const ratios = getAllAspectRatios();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← 一覧に戻る
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        アスペクト比から探す
      </h1>
      {ratios.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          アスペクト比が登録された作品がまだありません。
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ratios.map((ratio) => (
            <li key={ratio.slug}>
              <Link
                href={`/aspect-ratios/${ratio.slug}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <span className="text-zinc-800 dark:text-zinc-200">
                  {ratio.value}
                </span>
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {ratio.count}作品
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
