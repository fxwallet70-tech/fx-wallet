/*
 * Plan duration helpers.
 *
 * A plan can be offered for a mix of days, hours and minutes, e.g.
 * "1 day 2 hours 30 minutes". `duration` keeps holding the day count so every
 * plan created before this feature still works unchanged — `durationHours` and
 * `durationMinutes` simply default to 0.
 *
 * Every place that needs to know how long a plan lasts (subscription
 * activation, CDM approval, renewal) must go through these helpers so the
 * maturity date is always calculated the same way.
 */

const MINUTE_MS = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const toNonNegativeNumber = value => {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

// Total length of a plan in minutes (days + hours + minutes).
const getPlanDurationMinutes = (plan = {}) =>
  toNonNegativeNumber(plan.duration) * MINUTES_PER_DAY +
  toNonNegativeNumber(plan.durationHours) * MINUTES_PER_HOUR +
  toNonNegativeNumber(plan.durationMinutes);

// When a subscription that starts at `startDate` matures.
const buildEndDate = (startDate, plan) =>
  new Date(
    new Date(startDate).getTime() +
      getPlanDurationMinutes(plan) * MINUTE_MS,
  );

/*
 * Validates the three duration fields of a plan.
 *
 * Days may be fractional (0.5 day); hours and minutes must be whole numbers
 * because they are the fine-grained part of the duration. The combined length
 * must be at least 1 minute.
 */
const validatePlanDuration = ({
  duration,
  durationHours,
  durationMinutes,
}) => {
  const days = Number(duration ?? 0);
  const hours = Number(durationHours ?? 0);
  const minutes = Number(durationMinutes ?? 0);

  if (
    !Number.isFinite(days) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    days < 0 ||
    hours < 0 ||
    minutes < 0 ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return {
      valid: false,
      message:
        'Duration must be a valid number of days, whole hours and whole minutes',
    };
  }

  if (hours > 23 || minutes > 59) {
    return {
      valid: false,
      message: 'Hours must be 0-23 and minutes must be 0-59',
    };
  }

  if (
    days * MINUTES_PER_DAY +
      hours * MINUTES_PER_HOUR +
      minutes <
    1
  ) {
    return {
      valid: false,
      message: 'Duration must be at least 1 minute',
    };
  }

  return {
    valid: true,
    value: {
      days,
      hours,
      minutes,
    },
  };
};

module.exports = {
  MINUTE_MS,
  MINUTES_PER_HOUR,
  MINUTES_PER_DAY,
  getPlanDurationMinutes,
  buildEndDate,
  validatePlanDuration,
};
