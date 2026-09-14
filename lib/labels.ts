import type { Movie } from "@/lib/movie-schema";

export const statusLabel: Record<Movie["status"], string> = {
  now_showing: "公開中",
  upcoming: "公開予定",
  classic: "旧作",
};

export const highlightReasonLabel: Record<
  NonNullable<Movie["highlightReason"]>,
  string
> = {
  technical_highlight: "技術的に特筆すべき作品",
  revival_screening: "日本でのリバイバル上映作品",
};
