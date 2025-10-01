// src/routes/tmdb.ts
import { Router } from "express";
import { z } from "zod";

const router = Router();
const API = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

if (!KEY) {
  console.warn("[TMDB] Missing TMDB_API_KEY; /tmdb/* endpoints will fail");
}

/** Schemas for the bits we actually use */
const TmdbGenre = z.object({ id: z.number().optional(), name: z.string() });
const TmdbMovie = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().default(""),
  runtime: z.number().nullable().optional(),
  release_date: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  genres: z.array(TmdbGenre).default([]),
});

const TmdbSearch = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        title: z.string(),
        release_date: z.string().nullable().optional(),
        poster_path: z.string().nullable().optional(),
      })
    )
    .default([]),
});

/** Small helper to parse JSON with a schema */
async function jsonParse<T extends z.ZodTypeAny>(res: Response, schema: T): Promise<z.infer<T>> {
  if (!res.ok) throw new Error(`TMDb HTTP ${res.status}`);
  const raw = (await res.json()) as unknown; // still unknown here
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error("[TMDB] schema parse error:", parsed.error.flatten());
    throw new Error("TMDb response validation failed");
  }
  return parsed.data;
}

// GET /tmdb/movie/:id
router.get("/movie/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const r = await fetch(`${API}/movie/${encodeURIComponent(id)}?api_key=${KEY}&language=en-GB`);
    const data = await jsonParse(r, TmdbMovie);

    return res.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      runtime: data.runtime ?? null,
      releaseDate: data.release_date ?? null,
      posterPath: data.poster_path ?? null,
      genres: data.genres.map((g) => g.name),
    });
  } catch (e: any) {
    console.error("[TMDB] /movie failed:", e?.message || e);
    return res.status(500).json({ error: "TMDb fetch failed" });
  }
});

// GET /tmdb/search?query=term
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.query ?? "").trim();
    if (!q) return res.json({ results: [] });

    const r = await fetch(
      `${API}/search/movie?api_key=${KEY}&query=${encodeURIComponent(q)}&language=en-GB&page=1`
    );
    const data = await jsonParse(r, TmdbSearch);

    return res.json({
      results: data.results.map((m) => ({
        id: m.id,
        title: m.title,
        releaseDate: m.release_date ?? null,
        posterPath: m.poster_path ?? null,
      })),
    });
  } catch (e: any) {
    console.error("[TMDB] /search failed:", e?.message || e);
    return res.status(500).json({ error: "TMDb search failed" });
  }
});

export default router;
