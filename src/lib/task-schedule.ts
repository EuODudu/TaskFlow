import type { CalendarEvent } from "@/lib/queries";

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
) {
  return aStart < bEnd && bStart < aEnd;
}

export function findScheduleConflicts(
  events: CalendarEvent[],
  startsAt: Date,
  endsAt: Date,
  excludeEventId?: string,
) {
  return events.filter((e) => {
    if (excludeEventId && e.id === excludeEventId) return false;
    if (e.recurrence_rule) return false;
    return rangesOverlap(
      startsAt,
      endsAt,
      new Date(e.starts_at),
      new Date(e.ends_at),
    );
  });
}

export function defaultScheduleDurationMinutes(estimatedMinutes: number | null | undefined) {
  if (estimatedMinutes && estimatedMinutes > 0) return Math.min(estimatedMinutes, 480);
  return 60;
}
