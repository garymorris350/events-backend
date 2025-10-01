// src/routes/tmdb.ts
import { Router } from "express";
import { z } from "zod";

const router = Router();
const API = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

if (!KEY) {
  console.warn("[TMDB] Missing TMDB_API_KEY; /tmdb/* endpoints will fail");
}

// ---- helpers ----
async function fetchWithDebug(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    console.error("[TMDB] Request failed", {
      url,
      status: res.status,
      statusText: res.statusText,
      body,
    });
    throw new Error(`TMDb HTTP ${res.status}`);
  }
  return res;
}

// ---- schemas ----
const TmdbGenre = z.object({ id: z.number().optional(), name: z.string() });
const TmdbMovie = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().default(""),
  runtime: z.number().nullable().optional(),
  release_date: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  genres: z.array(TmdbGenre).default([]),
}).passthrough();

const TmdbSearch = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      release_date: z.string().nullable().optional(),
      poster_path: z.string().nullable().optional(),
    }).passthrough()
  ).default([]),
});

// ---- JSON parser ----
async function jsonParse<T extends z.ZodTypeAny>(res: Response, schema: T): Promise<z.infer<T>> {
  const raw = (await res.json()) as unknown;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error("[TMDB] schema parse error:", parsed.error.flatten());
    throw new Error("TMDb response validation failed");
  }
  return parsed.data;
}

// ---- routes ----
router.get("/movie/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const url = `${API}/movie/${encodeURIComponent(id)}?api_key=${KEY}&language=en-GB`;
    const r = await fetchWithDebug(url);
    const data = await jsonParse(r, TmdbMovie);

    res.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      runtime: data.runtime ?? null,
      releaseDate: data.release_date ?? null,
      posterPath: data.poster_path ?? null,
      genres: data.genres.map((g) => g.name),
    });
  } catch (e: any) {
    return res.status(500).json({ error: "TMDb fetch failed" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.query ?? "").trim();
    if (!q) return res.json({ results: [] });

    const url = `${API}/search/movie?api_key=${KEY}&query=${encodeURIComponent(q)}&language=en-GB&page=1`;
    const r = await fetchWithDebug(url);
    const data = await jsonParse(r, TmdbSearch);

    res.json({
      results: data.results.map((m) => ({
        id: m.id,
        title: m.title,
        releaseDate: m.release_date ?? null,
        posterPath: m.poster_path ?? null,
      })),
    });
  } catch (e: any) {
    return res.status(500).json({ error: "TMDb search failed" });
  }
});

export default router;
