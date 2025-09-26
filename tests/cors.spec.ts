// tests/cors.spec.ts
import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/index.js";

describe("CORS", () => {
  const allowedOrigin = "http://localhost:3000";
  const disallowedOrigin = "http://evil.com";

  it("should allow requests from an allowed origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", allowedOrigin);

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
  });

  it("should block requests from a disallowed origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", disallowedOrigin);

    // could be 403, 500, or just no CORS headers depending on config
    expect([200, 403, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers["access-control-allow-origin"]).not.toBe(disallowedOrigin);
    }
  });

  it("should handle requests without an Origin header", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
