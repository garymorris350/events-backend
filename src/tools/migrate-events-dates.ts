// src/tools/migrate-events-dates.ts
import "dotenv/config";
import { db } from "../lib/firebaseAdmin.js";
import { Timestamp } from "firebase-admin/firestore";

function parseToDate(s: string): Date | null {
  if (!s) return null;

  const trimmed = s.trim();
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  // fallback: replace space with 'T'
  if (trimmed.includes(" ")) {
    d = new Date(trimmed.replace(" ", "T"));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

async function run() {
  const snap = await db.collection("events").get();
  let updated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const update: any = {};
    let changed = false;

    for (const key of ["start", "end"] as const) {
      const v = data[key];

      // Already Timestamp → skip
      if (v && typeof v.toDate === "function") continue;

      if (typeof v === "string") {
        const d = parseToDate(v);
        if (d) {
          update[key] = Timestamp.fromDate(d);
          changed = true;
        } else {
          console.warn(`Doc ${doc.id}: could not parse ${key}="${v}"`);
          skipped++;
        }
      }
    }

    if (changed) {
      await doc.ref.update(update);
      updated++;
      console.log(`Updated doc ${doc.id}`);
    }
  }

  console.log(`\nMigration complete. Updated: ${updated}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
