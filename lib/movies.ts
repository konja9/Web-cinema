import fs from "node:fs";
import path from "node:path";
import { movieSchema, type Movie } from "./movie-schema";

const MOVIES_DIR = path.join(process.cwd(), "data", "movies");

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
