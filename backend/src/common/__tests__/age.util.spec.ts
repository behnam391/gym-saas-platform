import { calculateAge, isMinor, MINOR_AGE_THRESHOLD } from '../age.util';

describe('age.util', () => {
  describe('calculateAge', () => {
    it('calculates a straightforward age when the birthday already passed this year', () => {
      const dob = new Date('2000-01-15');
      const now = new Date('2026-06-27');
      expect(calculateAge(dob, now)).toBe(26);
    });

    it('does NOT overstate age when the birthday has not happened yet this year', () => {
      const dob = new Date('2000-12-31');
      const now = new Date('2026-06-27'); // birthday is still 6 months away
      expect(calculateAge(dob, now)).toBe(25);
    });

    it('handles the exact birthday correctly (turns the new age today)', () => {
      const dob = new Date('2008-06-27');
      const now = new Date('2026-06-27');
      expect(calculateAge(dob, now)).toBe(18);
    });

    it('handles the day before a birthday correctly (still the old age)', () => {
      const dob = new Date('2008-06-27');
      const now = new Date('2026-06-26');
      expect(calculateAge(dob, now)).toBe(17);
    });

    it('handles leap-year Feb 29 birthdays without throwing', () => {
      const dob = new Date('2008-02-29');
      const now = new Date('2026-03-01');
      expect(calculateAge(dob, now)).toBe(18);
    });
  });

  describe('isMinor', () => {
    it('is true for someone exactly one day under the threshold', () => {
      const dob = new Date('2008-06-28'); // turns 18 tomorrow relative to `now`
      const now = new Date('2026-06-27');
      expect(isMinor(dob, now)).toBe(true);
    });

    it('is false the moment someone turns 18', () => {
      const dob = new Date('2008-06-27');
      const now = new Date('2026-06-27');
      expect(isMinor(dob, now)).toBe(false);
    });

    it('respects MINOR_AGE_THRESHOLD as the single source of truth', () => {
      expect(MINOR_AGE_THRESHOLD).toBe(18);
    });
  });
});
