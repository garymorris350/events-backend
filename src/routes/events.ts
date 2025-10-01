// src/routes/events.ts
import { Router } from "express";
import { db } from "../lib/firebaseAdmin.js";
import { EventSchema } from "../lib/schemas.js";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// --- helpers ---
function toIso(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;                     // expect ISO for new docs
  if (v instanceof Date) return v.toISOString();
  if (typeof v?.toDate === "function") return v.toDate().toISOString(); // Firestore Timestamp
  if (typeof v?.seconds === "number") {                    // plain {seconds,nanoseconds}
    const ms = v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1e6);
    return new Date(ms).toISOString();
  }
  return "";
}
function normalizeEvent(id: string, data: any) {
  return {
    id,
    ...data,
    start: toIso(data.start),
    end: toIso(data.end),
  };
}

// GET all events
router.get("/", async (_req, res) => {
  const snapshot = await db.collection("events").orderBy("start").get();
  const events = snapshot.docs.map((doc) => normalizeEvent(doc.id, doc.data()));
  return res.json(events);
});

// GET single event
router.get("/:id", async (req, res) => {
  const doc = await db.collection("events").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  return res.json(normalizeEvent(doc.id, doc.data()));
});

// CREATE event
router.post("/", async (req, res) => {
  try {
    // validate/normalize new input (expects ISO strings)
    const parsed = EventSchema.parse(req.body);
    const data = {
      ...parsed,
      createdAt: Timestamp.now(),
    };
    const docRef = await db.collection("events").add(data);
    const saved = await docRef.get();
    return res.status(201).json(normalizeEvent(saved.id, saved.data()));
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Invalid payload" });
  }
});

export default router;
