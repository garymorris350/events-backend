
import { initializeApp, getApps, cert } from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!b64) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_B64');

const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
export const app = getApps()[0] || initializeApp({ credential: cert(json) });
export const db = getFirestore(app);
