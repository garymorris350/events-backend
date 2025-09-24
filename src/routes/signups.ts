import { Router } from "express";
import { db } from "../lib/firebaseAdmin.js";
import { SignupSchema } from "../lib/schemas.js";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

router.post("/", async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { eventId, amountPence } = parsed.data;

  // fetch event for validation
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) return res.status(400).json({ error: "Invalid eventId" });
  const ev = eventDoc.data()!;

  if (ev.priceType === "free" && amountPence) {
    return res.status(400).json({ error: "This event is free; no payment allowed" });
  }
  if (ev.priceType === "fixed" && amountPence != ev.pricePence) {
    return res.status(400).json({ error: "Must pay fixed price" });
  }
  // pay_what_you_feel: optional, just allow any positive amount

  const now = Timestamp.now();
  const doc = await db.collection("signups").add({ ...parsed.data, createdAt: now });
  res.status(201).json({ id: doc.id });
});

export default router;
