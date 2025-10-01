// src/routes/events.ts
import { Router } from "express";
import { db } from "../lib/firebaseAdmin.js";
import { EventSchema } from "../lib/schemas.js";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// GET all events
router.get("/", async (_req, res) => {
  const snapshot = await db.collection("events").orderBy("start").get();
  const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return res.json(events);
});

// GET single event
router.get("/:id", async (req, res) => {
  const doc = await db.collection("events").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  return res.json({ id: doc.id, ...doc.data() });
});

// GET event as .ics file
router.get("/:id/ics", async (req, res) => {
  const doc = await db.collection("events").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });

  const ev = doc.data()!;
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FilmHub//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${doc.id}@filmhub`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${new Date(ev.start).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTEND:${new Date(ev.end).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.description}`,
    `LOCATION:${ev.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  res.setHeader("Content-Type", "text/calendar");
  res.setHeader("Content-Disposition", `attachment; filename=event-${doc.id}.ics`);
  return res.send(icsContent);
});

// POST new event (admin only)
router.post("/", async (req, res) => {
  if (req.get("x-admin-passcode") !== process.env.ADMIN_PASSCODE) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = {
    ...parsed.data,
    // movieId will be present here if supplied (optional)
    createdAt: Timestamp.now(),
  };

  const docRef = await db.collection("events").add(data);

  // fetch saved document so we return full event
  const saved = await docRef.get();
  const event = { id: saved.id, ...saved.data() };

  return res.status(201).json(event);
});

export default router;
