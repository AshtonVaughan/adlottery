const DAY_MS = 86_400_000;

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStartUtc(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - daysSinceMonday * DAY_MS);
}

export function weekBounds(date: Date): { opensAt: Date; closesAt: Date; weekStart: string } {
  const opensAt = weekStartUtc(date);
  return {
    opensAt,
    closesAt: new Date(opensAt.getTime() + 7 * DAY_MS),
    weekStart: utcDateKey(opensAt),
  };
}

/** YYYY-MM-DD in UTC. One entry per user per key per draw. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ISO-8601 week number and week-numbering year. */
export function isoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // The Thursday of this week decides the ISO year.
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const year = d.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  return { week: 1 + Math.floor((d.getTime() - jan1) / (7 * DAY_MS)), year };
}

export function isoWeekNumber(date: Date): number {
  return isoWeek(date).week;
}

export function weekLabel(weekStart: string): string {
  const { week, year } = isoWeek(new Date(`${weekStart}T00:00:00Z`));
  return `Week ${week}, ${year}`;
}
