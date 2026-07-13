export const MINOR_AGE_THRESHOLD = 18;

/**
 * Calendar-correct age calculation (accounts for whether the birthday has
 * occurred yet this year) — a naive `currentYear - birthYear` overstates
 * age by one for anyone whose birthday hasn't happened yet this year.
 */
export function calculateAge(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export function isMinor(dateOfBirth: Date, now: Date = new Date()): boolean {
  return calculateAge(dateOfBirth, now) < MINOR_AGE_THRESHOLD;
}
