// src/index.ts
// Load env first so downstream modules see variables
import "dotenv/config";

import express from "express";
import cors, { type CorsOptions } from "cors";

import events from "./routes/events.js";
import signups from "./routes/signups.js";
import checkout from "./routes/checkout.js"; // optional: Stripe
import tmdb from "./routes/tmdb.js";

// Surface crashes clearly during dev
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
  process.exit(1);
});

const app = express();
app.use(express.json());

/* =========================
   CORS
   ========================= */

const rawOrigins = String(process.env.ALLOW_ORIGINS ?? process.env.ALLOW_ORIGIN ?? "");
const parsedEnvOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0)
  .map((s) => s.replace(/\/$/, "")); // drop trailing slash after trimming

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const allowedOrigins = Array.from(new Set([...defaultDevOrigins, ...parsedEnvOrigins]));
const corsWarned = new Set<string>(); // avoid repeating the same warning

const corsOptions: CorsOptions = {
  // Return false (don’t throw) so tests/clients see a clean CORS denial
  origin(origin, callback) {
    if (!origin) return callback(null, true); // server-to-server / curl / tests

    const normalized = origin.replace(/\/$/, "");
    const ok =
      allowedOrigins.includes(normalized) ||
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalized) ||
      /^http:\/\/192\.168\.\d+\.\d+(?::\d+)?$/.test(normalized) ||
      /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(normalized);

    if (ok) return callback(null, true);

    if (!corsWarned.has(origin)) {
      corsWarned.add(origin);
      console.warn("[CORS] blocked origin:", origin);
    }
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-passcode"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Express 5 + path-to-regexp v6: use a regexp instead of "*"
app.options(/.*/, cors(corsOptions));

/* =========================
   Routes
   ========================= */

app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    version: process.env.npm_package_version || "unknown",
  })
);

app.use("/events", events);
app.use("/signups", signups);
app.use("/checkout", checkout);

// Enable /tmdb only if configured
if (process.env.TMDB_API_KEY?.trim()) {
  app.use("/tmdb", tmdb);
}

/* =========================
   Start
   ========================= */

if (process.env.NODE_ENV !== "test") {
  const port = Number.parseInt(process.env.PORT ?? "", 10) || 10000;
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
    console.log(
      "Allowed origins:",
      allowedOrigins.length ? allowedOrigins.join(", ") : "(none)"
    );
  });
}

export default app;
