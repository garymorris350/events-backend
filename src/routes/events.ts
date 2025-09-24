import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/firebaseAdmin.js";

const router = Router();

/** Helpers */
const toISO = (v: any) => {
  // Firestore Timestamp -> ISO, Date -> ISO, string -> string
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return undefined;
};

const serializeEvent = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  title: data.title,
  description: data.description ?? "",
  location: data.location,
  isPaid: Boolean(data.isPaid),
  priceType: data.priceType ?? "free",
  start: toISO(data.start),
  end: toISO(data.end),
  createdAt: toISO(data.createdAt),
  updatedAt: toISO(data.updatedAt),
});

/** Validation */
const isoDateString = z
  .string()
  .min(1, "Required")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date/time (use ISO)");

// Event schema for POST/PUT
const eventSchema = z.object({
  title: z.string().min(1).transform((s) => s.trim()),
  description: z.string().optional().transform((s) => (s ?? "").trim()),
  location: z.string().min(1).transform((s) => s.trim()),
  start: isoDateString, // e.g. "2025-10-01T18:00:00Z"
  end: isoDateString,
  isPaid: z.boolean().default(false),
  priceType: z.enum(["free", "paid"]).default("free"),
});

/** Middleware: simple admin check for mutating routes */
function requireAdmin(req: any, res: any, next: any) {
  const pass = req.headers["x-admin-passcode"];
  if (pass !== process.env.ADMIN_PASSCODE) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

/** POST /events → create event (admin) */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const data = parsed.data;

    const now = new Date();
    const docRef = await db.collection("events").add({
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
      createdAt: now,
      updatedAt: now,
    });

    const saved = await docRef.get();
    return res.status(201).json(serializeEvent(saved.id, saved.data()!));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/** GET /events → list all (ascending by start) */
router.get("/", async (_req, res) => {
  try {
    const snap = await db.collection("events").orderBy("start", "asc").get();
    const events = snap.docs.map((d) => serializeEvent(d.id, d.data()));
    return res.json(events);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/** GET /events/:id → fetch single event (for details page) */
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("events").doc(String(req.params.id)).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    return res.json(serializeEvent(doc.id, doc.data()!));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
