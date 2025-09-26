import "dotenv/config";
import express from "express";
import cors, { CorsOptions } from "cors";

import events from "./routes/events.js";
import signups from "./routes/signups.js";
import checkout from "./routes/checkout.js"; // Stripe

const app = express();
app.use(express.json());

// Allow multiple origins via env (comma-separated). Fallback to common dev origins.
const envOriginsRaw = process.env.ALLOW_ORIGINS ?? process.env.ALLOW_ORIGIN ?? "";
const envOrigins = envOriginsRaw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

const allowedOrigins = Array.from(new Set([...defaultDevOrigins, ...envOrigins]));

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/192\.168\.\d+\.\d+(?::\d+)?$/.test(origin)) return callback(null, true);

    console.warn("CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/events", events);
app.use("/signups", signups);
app.use("/checkout", checkout);

// Only listen if not in test mode
if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 10000;
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
    console.log("Allowed origins:", allowedOrigins.length ? allowedOrigins.join(", ") : "(none)");
  });
}

// Export app for testing
export default app;
