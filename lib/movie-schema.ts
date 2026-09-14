import { z } from "zod";

export const movieSchema = z.object({
  id: z.string(), // IMDb ID (例: tt1234567)
  slug: z.string(), // URLで使う識別子
  titleJa: z.string(),
  titleOriginal: z.string(),
  releaseDateJapan: z.string(), // ISO date (YYYY-MM-DD)
  posterUrl: z.string().optional(),
  overview: z.string().optional(),
  status: z.enum(["now_showing", "upcoming", "classic"]),
  // classic(旧作)の場合のみ、掲載理由を示す
  highlightReason: z.enum(["technical_highlight", "revival_screening"]).optional(),
  technicalSpecs: z.object({
    aspectRatio: z.string().optional(),
    camera: z.array(z.string()).optional(),
    negativeFormat: z.string().optional(),
    printedFilmFormat: z.string().optional(),
    cinematographicProcess: z.string().optional(),
  }),
  sourceUrls: z.object({
    imdb: z.string(),
    tmdb: z.string().optional(),
  }),
  lastUpdated: z.string(), // ISO datetime
});

export type Movie = z.infer<typeof movieSchema>;
