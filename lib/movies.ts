import fs from "node:fs";
import path from "node:path";
import { movieSchema, type Movie } from "./movie-schema";
import { slugify } from "./slugify";

const MOVIES_DIR = path.join(process.cwd(), "data", "movies");

export type FacetOption = { value: string; slug: string; count: number };

export function getAllMovies(): Movie[] {
  const files = fs
    .readdirSync(MOVIES_DIR)
    .filter((file) => file.endsWith(".json"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(MOVIES_DIR, file), "utf-8");
      return movieSchema.parse(JSON.parse(raw));
    })
    .sort((a, b) => a.releaseDateJapan.localeCompare(b.releaseDateJapan));
}

export function getMovieBySlug(slug: string): Movie | undefined {
  return getAllMovies().find((movie) => movie.slug === slug);
}

function groupBySlug(values: string[]): FacetOption[] {
  const groups = new Map<string, { value: string; count: number }>();
  for (const value of values) {
    const slug = slugify(value);
    if (!slug) continue;
    const existing = groups.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(slug, { value, count: 1 });
    }
  }
  return Array.from(groups.entries())
    .map(([slug, { value, count }]) => ({ slug, value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export function getAllCameras(): FacetOption[] {
  const movies = getAllMovies();
  const cameras = movies.flatMap((m) => m.technicalSpecs.camera ?? []);
  return groupBySlug(cameras);
}

export function getMoviesByCameraSlug(slug: string): Movie[] {
  return getAllMovies().filter((movie) =>
    (movie.technicalSpecs.camera ?? []).some((c) => slugify(c) === slug),
  );
}

export function getAllAspectRatios(): FacetOption[] {
  const movies = getAllMovies();
  const ratios = movies
    .map((m) => m.technicalSpecs.aspectRatio)
    .filter((r): r is string => Boolean(r));
  return groupBySlug(ratios);
}

export function getMoviesByAspectRatioSlug(slug: string): Movie[] {
  return getAllMovies().filter(
    (movie) => slugify(movie.technicalSpecs.aspectRatio ?? "") === slug,
  );
}
