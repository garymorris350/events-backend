// tests/tmdb.spec.ts
import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/index.js";

describe("TMDb", () => {
  it("GET /tmdb/search returns results", async () => {
    const res = await request(app).get("/tmdb/search?query=Inception");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("GET /tmdb/movie/:id returns details", async () => {
    const res = await request(app).get("/tmdb/movie/27205"); // Inception
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 27205);
    expect(res.body).toHaveProperty("title");
  });
});
