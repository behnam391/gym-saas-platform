import { isValidUuid, assertValidUuid } from '../uuid.util';

describe('uuid.util', () => {
  describe('isValidUuid', () => {
    it('accepts a well-formed v4 UUID', () => {
      expect(isValidUuid('3fa85f64-5717-4562-b3fc-2c963f66afa6')).toBe(true);
    });

    it('rejects an empty string', () => {
      expect(isValidUuid('')).toBe(false);
    });

    it('rejects a SQL-injection attempt disguised as a tenantId', () => {
      // The exact scenario assertValidUuid exists to stop: if a tenantId
      // ever reached PrismaService without having been a real UUID, this
      // is the kind of payload that would otherwise be interpolated
      // straight into `SET LOCAL app.tenant_id = '...'`.
      const malicious = "x'; DROP TABLE \"User\"; --";
      expect(isValidUuid(malicious)).toBe(false);
    });

    it('rejects a near-miss (one character short)', () => {
      expect(isValidUuid('3fa85f64-5717-4562-b3fc-2c963f66afa')).toBe(false);
    });
  });

  describe('assertValidUuid', () => {
    it('does not throw for a valid UUID', () => {
      expect(() =>
        assertValidUuid('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'test'),
      ).not.toThrow();
    });

    it('throws with the provided context in the message for an invalid UUID', () => {
      expect(() => assertValidUuid('not-a-uuid', 'PrismaService.forTenant')).toThrow(
        /PrismaService\.forTenant/,
      );
    });
  });
});
