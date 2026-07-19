/**
 * PREREQUISITES — this test hits a REAL Postgres database, not a mock:
 *
 *   1. `npx prisma migrate deploy` already run against TEST_DATABASE_URL
 *   2. `psql $TEST_DATABASE_URL -f prisma/rls-policies.sql` already run
 *   3. Both the `gym_app` role (RLS-restricted) and a way to connect as it
 *      must exist — TEST_DATABASE_URL should point at that role, e.g.
 *      postgresql://gym_app:...@localhost:5432/gym_saas_test
 *
 * This is the single most important test in the whole codebase: it proves
 * the database-layer isolation guarantee described in database-design.md
 * actually holds, independent of whether `forTenant()` is used correctly
 * everywhere in application code. Run via `npm run test:e2e`.
 *
 * Skipped automatically (not failed) if TEST_DATABASE_URL isn't set, so the
 * regular unit-test run / CI lint job doesn't require a live database.
 */
import { PrismaClient } from '@prisma/client';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DB_URL ? describe : describe.skip;

describeIfDb('Row-Level Security: cross-tenant isolation', () => {
  let prisma: PrismaClient;
  let tenantAId: string;
  let tenantBId: string;
  let athleteProfileBId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

    const tenantA = await prisma.tenant.create({
      data: { slug: `test-gym-a-${Date.now()}`, name: 'باشگاه تست آ', city: 'تهران', address: 'آدرس آ' },
    });
    const tenantB = await prisma.tenant.create({
      data: { slug: `test-gym-b-${Date.now()}`, name: 'باشگاه تست ب', city: 'مشهد', address: 'آدرس ب' },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    // One Attendance row per tenant — Attendance is one of the tables RLS
    // is enabled on in rls-policies.sql.
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantAId}'`);
      const userA = await tx.user.create({
        data: {
          tenantId: tenantAId,
          role: 'ATHLETE',
          firstName: 'کاربر', lastName: 'آ',
          nationalId: `A-${Date.now()}`, mobile: `0910${Date.now() % 10000000}`,
          passwordHash: 'x', gender: 'MALE', dateOfBirth: new Date('1990-01-01'),
          athleteProfile: { create: {} },
        },
      });
      await tx.attendance.create({
        data: { tenantId: tenantAId, userId: userA.id, method: 'MANUAL' },
      });
    });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantBId}'`);
      const userB = await tx.user.create({
        data: {
          tenantId: tenantBId,
          role: 'ATHLETE',
          firstName: 'کاربر', lastName: 'ب',
          nationalId: `B-${Date.now()}`, mobile: `0911${Date.now() % 10000000}`,
          passwordHash: 'x', gender: 'FEMALE', dateOfBirth: new Date('1990-01-01'),
          athleteProfile: { create: {} },
        },
        include: { athleteProfile: true },
      });
      athleteProfileBId = userB.athleteProfile!.id;
      await tx.attendance.create({
        data: { tenantId: tenantBId, userId: userB.id, method: 'MANUAL' },
      });
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it("a session scoped to tenant A cannot see tenant B's attendance rows", async () => {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantAId}'`);
      return tx.attendance.findMany({ where: { tenantId: tenantBId } });
    });
    // Even though we explicitly filtered `where: { tenantId: tenantBId }`,
    // RLS must still return zero rows — proving the database layer enforces
    // isolation independent of the application's WHERE clause.
    expect(rows).toHaveLength(0);
  });

  it('a session scoped to tenant A sees only its own attendance rows even with no WHERE filter', async () => {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantAId}'`);
      return tx.attendance.findMany(); // no tenantId filter at all
    });
    expect(rows.every((r) => r.tenantId === tenantAId)).toBe(true);
    expect(rows.some((r) => r.tenantId === tenantBId)).toBe(false);
  });

  it('switching the session variable to tenant B flips visibility accordingly', async () => {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantBId}'`);
      return tx.attendance.findMany();
    });
    expect(rows.every((r) => r.tenantId === tenantBId)).toBe(true);
  });

  it("tenant A cannot see tenant B's indirectly-scoped athlete profile", async () => {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantAId}'`);
      return tx.athleteProfile.findMany({ where: { id: athleteProfileBId } });
    });
    expect(rows).toHaveLength(0);
  });

  it("tenant A cannot add a measurement to tenant B's athlete profile", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantAId}'`);
        return tx.bodyMeasurement.create({
          data: { athleteId: athleteProfileBId, weightKg: 80 },
        });
      }),
    ).rejects.toThrow();
  });

  it('an INSERT with a tenantId that does not match the session variable is rejected by the WITH CHECK policy', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantAId}'`);
        // Attempting to write a row tagged as tenant B while scoped to
        // tenant A must violate the policy's WITH CHECK clause.
        return tx.attendance.create({
          data: {
            tenantId: tenantBId,
            userId: (await tx.user.findFirstOrThrow({ where: { tenantId: tenantAId } })).id,
            method: 'MANUAL',
          },
        });
      }),
    ).rejects.toThrow();
  });
});
