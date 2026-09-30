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

/** ISO-8601 week number. */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / DAY_MS - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    )
  );
}

export function weekLabel(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  return `Week ${isoWeekNumber(d)}, ${d.getUTCFullYear()}`;
}
