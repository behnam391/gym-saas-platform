import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Scope,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../common/tenant-context';
import { assertValidUuid } from '../common/uuid.util';

/**
 * Request-scoped Prisma wrapper.
 *
 * Two layers of tenant isolation, both driven by the SAME trusted
 * TenantContext (populated only from a verified JWT — see
 * TenantContextMiddleware):
 *
 *   1. App-layer: `forTenant()` returns a client whose every query runs
 *      inside a transaction that has first executed
 *      `SET LOCAL app.tenant_id = '<tenantId>'`.
 *   2. DB-layer: Postgres Row-Level Security policies (see
 *      database-design.md) read that same session variable and silently
 *      filter out rows belonging to any other tenant — so even a bug in
 *      application code that forgets a `WHERE tenantId = ...` clause
 *      cannot leak cross-tenant data.
 *
 * Super Admin endpoints use `forPlatform()`, which connects through a
 * separate Postgres role that BYPASSES RLS entirely (granted explicitly,
 * never implicitly) for legitimate cross-tenant reporting.
 */
@Injectable({ scope: Scope.REQUEST })
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly tenantClient: PrismaClient;
  private readonly platformClient: PrismaClient;

  constructor(private readonly tenantContext: TenantContext) {
    this.tenantClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
    this.platformClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_ADMIN_URL } },
    });
  }

  async onModuleInit() {
    await this.tenantClient.$connect();
  }

  async onModuleDestroy() {
    await this.tenantClient.$disconnect();
    await this.platformClient.$disconnect();
  }

  /**
   * Run `fn` with a Prisma client scoped to the current request's tenant.
   * Every call wraps in a transaction that sets the RLS session variable
   * first, so policies on every table apply automatically.
   */
  async forTenant<T>(
    fn: (tx: PrismaClient) => Promise<T>,
  ): Promise<T> {
    const tenantId = this.tenantContext.requireTenantId();
    // Defense in depth: tenantId originates from a verified JWT, but we
    // never interpolate unvalidated strings into raw SQL regardless.
    assertValidUuid(tenantId, 'PrismaService.forTenant');
    return this.tenantClient.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.tenant_id = '${tenantId}'`,
      );
      return fn(tx as unknown as PrismaClient);
    });
  }

  /**
   * Cross-tenant access for SUPER_ADMIN-only flows. Callers MUST guard this
   * behind a RolesGuard(['SUPER_ADMIN']) — this method does not re-check
   * the role itself, by design, to keep authorization in one place (guards).
   */
  forPlatform(): PrismaClient {
    return this.platformClient;
  }
}
