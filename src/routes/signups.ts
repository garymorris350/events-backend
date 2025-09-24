import { Router } from 'express';
import { db } from '../lib/firebaseAdmin.js';
import { SignupSchema } from '../lib/schemas.js';
import { Timestamp } from 'firebase-admin/firestore';

const router = Router();

router.post('/', async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const now = Timestamp.now();
  const doc = await db.collection('signups').add({ ...parsed.data, createdAt: now });
  res.status(201).json({ id: doc.id });
});

export default router;
