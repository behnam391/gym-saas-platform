import { validateEnv } from '../env.validation';

const validEnv = {
  DATABASE_URL: 'postgresql://gym_app:password@localhost:5432/gym_saas',
  DATABASE_ADMIN_URL: 'postgresql://gym_admin:password@localhost:5432/gym_saas',
  JWT_ACCESS_SECRET: 'a-secure-random-secret-with-more-than-32-characters',
};

describe('validateEnv', () => {
  it('accepts a complete environment', () => {
    expect(validateEnv({ ...validEnv })).toEqual(validEnv);
  });

  it('lists missing required variables', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET })).toThrow(
      'DATABASE_URL, DATABASE_ADMIN_URL',
    );
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'too-short' }),
    ).toThrow('حداقل ۳۲ کاراکتر');
  });
});
