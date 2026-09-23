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
 * Validates the raw form values before they are sent to the API.
 * Returns an error message, or null when the duration is usable.
 */
export const validatePlanDurationInput = (
  plan: PlanDurationFields
): string | null => {
  const days = Number(plan.duration ?? 0);
  const hours = Number(plan.durationHours ?? 0);
  const minutes = Number(plan.durationMinutes ?? 0);

  if (!Number.isFinite(days) || days < 0) {
    return "Days must be 0 or more";
  }

  if (
    !Number.isInteger(hours) ||
    hours < 0 ||
    hours > 23
  ) {
    return "Hours must be a whole number between 0 and 23";
  }

  if (
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "Minutes must be a whole number between 0 and 59";
  }

  if (
    days * MINUTES_PER_DAY +
      hours * MINUTES_PER_HOUR +
      minutes <
    1
  ) {
    return "Duration must be at least 1 minute";
  }

  return null;
};
