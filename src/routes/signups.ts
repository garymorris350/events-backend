import { Router } from "express";
import { db } from "../lib/firebaseAdmin.js";
import { SignupSchema } from "../lib/schemas.js";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

router.post("/", async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { eventId, amountPence } = parsed.data;

  // Validate event exists
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) {
    return res.status(400).json({ error: "Invalid eventId" });
  }
  const ev = eventDoc.data()!;

  // Validate pricing rules
  if (ev.priceType === "free" && amountPence) {
    return res.status(400).json({ error: "This event is free; no payment allowed" });
  }
  if (ev.priceType === "fixed" && amountPence !== ev.pricePence) {
    return res.status(400).json({ error: "Must pay fixed price" });
  }
  // pay_what_you_feel: any positive amount allowed

  // Save signup
  const now = Timestamp.now();
  const docRef = await db.collection("signups").add({
    ...parsed.data,
    createdAt: now,
  });

  // Fetch saved doc so response matches tests
  const savedDoc = await docRef.get();
  const signup = { id: savedDoc.id, ...savedDoc.data() };

  return res.status(201).json(signup);
});

export default router;
