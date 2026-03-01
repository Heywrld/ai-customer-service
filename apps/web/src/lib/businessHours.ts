// Business hours helper — WAT (Africa/Lagos, UTC+1)

type HoursRange = { open: string; close: string } | null;

interface BusinessHoursConfig {
  mon_fri?: HoursRange;
  sat?: HoursRange;
  sun?: HoursRange;
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Returns true if the business is currently open based on WAT time. */
export function isBusinessOpen(businessHours: unknown): boolean {
  if (!businessHours || typeof businessHours !== "object") return true; // no config = always open

  const config = businessHours as BusinessHoursConfig;

  // Get current time in WAT by parsing a WAT locale string back to Date
  const now = new Date();
  const watNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  const dayOfWeek = watNow.getDay(); // 0=Sun 1=Mon … 6=Sat
  const currentMinutes = watNow.getHours() * 60 + watNow.getMinutes();

  let range: HoursRange = null;
  if (dayOfWeek === 0) {
    range = config.sun ?? null;
  } else if (dayOfWeek === 6) {
    range = config.sat ?? null;
  } else {
    range = config.mon_fri ?? null;
  }

  if (!range) return false; // closed on this day (range is null)

  return currentMinutes >= parseTime(range.open) && currentMinutes < parseTime(range.close);
}

/** Formats business hours for display in a message, e.g. "Mon-Fri 09:00–19:00, Sat 10:00–20:00 WAT" */
export function getBusinessHoursText(businessHours: unknown): string {
  if (!businessHours || typeof businessHours !== "object") return "Mon-Fri 9AM–7PM WAT";

  const config = businessHours as BusinessHoursConfig;
  const parts: string[] = [];

  if (config.mon_fri) parts.push(`Mon-Fri ${config.mon_fri.open}–${config.mon_fri.close}`);
  if (config.sat) parts.push(`Sat ${config.sat.open}–${config.sat.close}`);
  if (config.sun) parts.push(`Sun ${config.sun.open}–${config.sun.close}`);

  return (parts.length ? parts.join(", ") : "check our schedule") + " WAT";
}
