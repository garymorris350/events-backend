// src/index.ts
// 1) Load env FIRST so any imported modules (e.g., firebaseAdmin) see variables
import "dotenv/config";

// Optional: clearer crash logs during dev
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
  process.exit(1);
});

import express from "express";
import cors, { type CorsOptions } from "cors";

import events from "./routes/events.js";
import signups from "./routes/signups.js";
import checkout from "./routes/checkout.js"; // Stripe (optional)
import tmdb from "./routes/tmdb.js";

const app = express();
app.use(express.json());

/* =========================
   CORS Config
   ========================= */

// Parse env origins (comma-separated list)
const envOriginsRaw =
  (process.env.ALLOW_ORIGINS || process.env.ALLOW_ORIGIN || "").toString();
const envOrigins = envOriginsRaw
  .split(",")
  .map((s) => s.trim().replace(/\/$/, "")) // normalize trailing slash
  .filter(Boolean);

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const allowedOrigins = Array.from(new Set([...defaultDevOrigins, ...envOrigins]));

// Don’t throw in origin() — return false to deny so tests can assert headers cleanly
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // server-to-server / curl / tests

    const normalized = origin.replace(/\/$/, "");
    const ok =
      allowedOrigins.includes(normalized) ||
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalized) ||
      /^http:\/\/192\.168\.\d+\.\d+(?::\d+)?$/.test(normalized) ||
      /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(normalized);

    if (ok) return callback(null, true);

    console.warn("CORS blocked origin:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-passcode"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Express 5 + path-to-regexp v6: avoid "*" (invalid). Use a regexp for “all”.
app.options(/.*/, cors(corsOptions));

/* =========================
   Routes
   ========================= */

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/events", events);
app.use("/signups", signups);
app.use("/checkout", checkout);

// Enable /tmdb only when an API key is set (avoids import-time surprises)
if (process.env.TMDB_API_KEY && process.env.TMDB_API_KEY.trim()) {
  app.use("/tmdb", tmdb);
} else {
  console.warn("[tmdb] TMDB_API_KEY not set — /tmdb routes disabled");
}

/* =========================
   Start Server
   ========================= */

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 10000;
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
    console.log(
      "Allowed origins:",
      allowedOrigins.length ? allowedOrigins.join(", ") : "(none)"
    );
  });
}

export default app;
