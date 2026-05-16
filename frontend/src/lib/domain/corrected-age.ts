/**
 * Corrected-age math for premature babies.
 *
 *   correction (days) = (40 - gestationalAgeWeeks) * 7   (clamped to >= 0)
 *   corrected (days)  = chronological (days) - correction
 *
 * Term babies (GA >= 40) get correction = 0.
 */

const MS_PER_DAY = 86_400_000;

export type GestationalAge = number; // weeks at birth, 22..41

export interface AgeBreakdown {
  /** Days since DOB. */
  chronologicalDays: number;
  /** Days, corrected for prematurity (>= 0). */
  correctedDays: number;
  /** Weeks of correction applied. */
  correctionWeeks: number;
  isPreterm: boolean;
}

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((b - a) / MS_PER_DAY);
}

export function isValidGestationalAge(weeks: number): weeks is GestationalAge {
  return Number.isInteger(weeks) && weeks >= 22 && weeks <= 41;
}

export function isPreterm(weeks: GestationalAge): boolean {
  return weeks < 37;
}

export function correctedAge(
  dob: Date,
  gestationalAgeWeeks: GestationalAge,
  now: Date = new Date(),
): AgeBreakdown {
  if (!isValidGestationalAge(gestationalAgeWeeks)) {
    throw new RangeError(`gestationalAgeWeeks must be 22..41, got ${gestationalAgeWeeks}`);
  }
  const chronological = Math.max(0, daysBetween(dob, now));
  const correctionWeeks = Math.max(0, 40 - gestationalAgeWeeks);
  const corrected = Math.max(0, chronological - correctionWeeks * 7);
  return {
    chronologicalDays: chronological,
    correctedDays: corrected,
    correctionWeeks,
    isPreterm: isPreterm(gestationalAgeWeeks),
  };
}

export interface HumanAge {
  months: number;
  remainingDays: number;
  /** Always whole months for display when remainingDays is small. */
  label: string;
}

/** Convert days to a "X months" style label using a 30.44-day month (Intl-style). */
export function daysToHumanAge(days: number): HumanAge {
  const avgMonth = 30.4375;
  const months = Math.floor(days / avgMonth);
  const remainingDays = Math.round(days - months * avgMonth);
  let label: string;
  if (days < 30) {
    label = `${days} days`;
  } else if (months < 24) {
    label = `${months} months`;
  } else {
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    label = remMonths ? `${years}y ${remMonths}m` : `${years} years`;
  }
  return { months, remainingDays, label };
}
