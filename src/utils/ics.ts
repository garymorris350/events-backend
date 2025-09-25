// src/utils/ics.ts
export type IcsEventInput = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
  url?: string;
};

function fmtUtc(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function esc(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function buildIcs(e: IcsEventInput) {
  const dtstamp = fmtUtc(new Date().toISOString());
  const dtstart = fmtUtc(e.startIso);
  const dtend = fmtUtc(e.endIso);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Events Platform//Launchpad//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${esc(e.uid)}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${esc(e.title)}`,
    e.description ? `DESCRIPTION:${esc(e.description)}` : null,
    e.location ? `LOCATION:${esc(e.location)}` : null,
    e.url ? `URL:${esc(e.url)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
