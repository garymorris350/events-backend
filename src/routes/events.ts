// src/routes/events.ts
import { Router } from "express";
import { db } from "../lib/firebaseAdmin.js";
import { EventSchema } from "../lib/schemas.js";
import { Timestamp } from "firebase-admin/firestore";
import ics from "ics";
const { createEvent: createIcsEvent } = ics;

const router = Router();

/* =========================
   Startup checks
   ========================= */
const ADMIN_PASS = (process.env.ADMIN_PASSCODE ?? "").trim();
if (!ADMIN_PASS) {
  console.warn(
    "[events] ADMIN_PASSCODE is empty. POST/DELETE /events will always return 403 until set."
  );
}

/* =========================
   Helpers
   ========================= */
function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().toISOString(); // Firestore Timestamp
  if (v instanceof Date) return v.toISOString();
  if (typeof v?.seconds === "number") {
    const ms = v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1e6);
    return new Date(ms).toISOString();
  }
  if (typeof v === "string") {
    const s = v.trim();
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();
    if (s.includes(" ")) {
      d = new Date(s.replace(" ", "T"));
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  }
  return null;
}

function normalizeEvent(id: string, data: any) {
  return {
    id,
    ...data,
    start: toIso(data.start),
    end: toIso(data.end),
  };
}

/** Convert ISO string to [yyyy, m, d, hh, mm] for `ics` */
function isoToDateArray(iso: string | null | undefined) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ] as [number, number, number, number, number];
}

/* =========================
   Routes
   ========================= */

// GET all events
router.get("/", async (_req, res) => {
  const snapshot = await db.collection("events").orderBy("start").get();
  const events = snapshot.docs.map((doc) =>
    normalizeEvent(doc.id, doc.data())
  );
  return res.json(events);
});

// GET single event
router.get("/:id", async (req, res) => {
  const doc = await db.collection("events").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  return res.json(normalizeEvent(doc.id, doc.data()));
});

// GET event as ICS
router.get("/:id/ics", async (req, res) => {
  const doc = await db.collection("events").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });

  const ev = normalizeEvent(doc.id, doc.data());
  const { error, value } = createIcsEvent({
    start: isoToDateArray(ev.start),
    end: isoToDateArray(ev.end),
    title: ev.title,
    description: ev.description,
    location: ev.location,
    url: `${process.env.FRONTEND_URL || ""}/events/${ev.id}`,
  });

  if (error || !value) {
    return res
      .status(500)
      .json({ error: error?.message || "Failed to generate ICS" });
  }

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="event-${ev.id}.ics"`
  );
  return res.send(value);
});

// CREATE event (protected by admin passcode)
router.post("/", async (req, res) => {
  try {
    const raw = req.headers["x-admin-passcode"];
    const got =
      typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : "";

    if (!got) {
      return res
        .status(403)
        .json({ error: "Forbidden: missing x-admin-passcode header" });
    }
    if (!ADMIN_PASS) {
      return res
        .status(403)
        .json({ error: "Forbidden: server ADMIN_PASSCODE not configured" });
    }
    if (got !== ADMIN_PASS) {
      return res.status(403).json({ error: "Forbidden: invalid passcode" });
    }

    const parsed = EventSchema.parse(req.body);

    const data = {
      ...parsed,
      start: Timestamp.fromDate(new Date(parsed.start)),
      end: Timestamp.fromDate(new Date(parsed.end)),
      createdAt: Timestamp.now(),
    };

    const docRef = await db.collection("events").add(data);
    const saved = await docRef.get();
    return res.status(201).json(normalizeEvent(saved.id, saved.data()));
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Invalid payload" });
  }
});

// DELETE event (protected by admin passcode)
router.delete("/:id", async (req, res) => {
  try {
    const raw = req.headers["x-admin-passcode"];
    const got =
      typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : "";

    if (!got) {
      return res
        .status(403)
        .json({ error: "Forbidden: missing x-admin-passcode header" });
    }
    if (!ADMIN_PASS) {
      return res
        .status(403)
        .json({ error: "Forbidden: server ADMIN_PASSCODE not configured" });
    }
    if (got !== ADMIN_PASS) {
      return res.status(403).json({ error: "Forbidden: invalid passcode" });
    }

    const { id } = req.params;
    const ref = db.collection("events").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    await ref.delete();
    return res.json({ success: true });
  } catch (e: any) {
    console.error("[events] DELETE error:", e);
    return res.status(500).json({ error: e?.message || "Failed to delete event" });
  }
});

export default router;
