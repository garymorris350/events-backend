import { Router } from "express";
import { db } from "../lib/firebaseAdmin.js";
import { EventSchema } from "../lib/schemas.js"; // unified schema

const router = Router();

function toISO(v: any) {
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

function serializeEvent(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: data.title,
    description: data.description ?? "",
    location: data.location,
    start: toISO(data.start),
    end: toISO(data.end),
    priceType: data.priceType ?? "free",
    isPaid: Boolean(data.isPaid),
    pricePence: data.pricePence ?? undefined,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
}

function requireAdmin(req: any, res: any, next: any) {
  const pass = req.headers["x-admin-passcode"];
  if (!process.env.ADMIN_PASSCODE || pass !== process.env.ADMIN_PASSCODE) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// GET /events
router.get("/", async (_req, res) => {
  try {
    const snap = await db.collection("events").orderBy("start", "asc").get();
    const events = snap.docs.map((d) => serializeEvent(d.id, d.data()));
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /events (admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

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
    res.status(201).json(serializeEvent(saved.id, saved.data()!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /events/:id
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("events").doc(String(req.params.id)).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json(serializeEvent(doc.id, doc.data()!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
