/*
 * Plan duration helpers.
 *
 * A plan can run for a mix of days, hours and minutes, e.g.
 * "1 day 2 hours 30 minutes". The `duration` field holds the days part, so
 * plans created before hours/minutes existed keep working unchanged.
 */

export interface PlanDurationFields {
  duration?: number | null;
  durationHours?: number | null;
  durationMinutes?: number | null;
}

export interface RemainingTime {
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  // Compact form, e.g. "29d 23h", "2h 30m" or "45m".
  label: string;
}

const MINUTE_MS = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const toCount = (value?: number | null) => {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

// Whole length of a plan in minutes.
export const getPlanDurationMinutes = (
  plan: PlanDurationFields = {}
) =>
  toCount(plan.duration) * MINUTES_PER_DAY +
  toCount(plan.durationHours) * MINUTES_PER_HOUR +
  toCount(plan.durationMinutes);

// Human readable length, e.g. "1 day 2 hrs 30 mins".
export const formatPlanDuration = (
  plan: PlanDurationFields = {}
) => {
  const days = toCount(plan.duration);
  const hours = toCount(plan.durationHours);
  const minutes = toCount(plan.durationMinutes);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hr" : "hrs"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 mins";
};

/*
 * Time left until `endDate`. Plans shorter than a day are counted down in
 * hours and minutes so a 2 hour plan never shows "1 day left".
 */
export const getRemainingTime = (
  endDate?: string | null
): RemainingTime => {
  const expiry = endDate ? new Date(endDate).getTime() : 0;

  const totalMinutes =
    Number.isFinite(expiry) && expiry > Date.now()
      ? Math.ceil((expiry - Date.now()) / MINUTE_MS)
      : 0;

  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const hours = Math.floor(
    (totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR
  );
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  let label = "0m";

  if (totalMinutes > 0) {
    if (days > 0) {
      label = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    } else if (hours > 0) {
      label = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      label = `${minutes}m`;
    }
  }

  return {
    totalMinutes,
    days,
    hours,
    minutes,
    label,
  };
};

// Compact countdown, e.g. "2h 30m".
export const formatRemainingTime = (
  endDate?: string | null
) => getRemainingTime(endDate).label;

/*
 * Value + caption for a "time left" badge: the plain day count while at
 * least a day is left, hours/minutes for plans shorter than a day.
 */
export const getRemainingBadge = (
  endDate?: string | null,
  captions: { days?: string; short?: string } = {}
) => {
  const remaining = getRemainingTime(endDate);

  const daysCaption = captions.days ?? "days left";
  const shortCaption = captions.short ?? "left";

  return remaining.days >= 1
    ? { value: `${remaining.days}`, caption: daysCaption }
    : { value: remaining.label, caption: shortCaption };
};
