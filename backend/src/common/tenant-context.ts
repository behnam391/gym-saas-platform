import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped holder of the current tenant + actor.
 * Populated by TenantContextMiddleware from the verified JWT payload —
 * NEVER from a client-supplied header/body field, to prevent tenant spoofing.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  tenantId: string | null = null;
  userId: string | null = null;
  role: string | null = null;
  isSuperAdmin = false;

  requireTenantId(): string {
    if (!this.tenantId) {
      throw new Error(
        'TenantContext: tenantId is missing. This operation requires a tenant-scoped request.',
      );
    }
    return this.tenantId;
  }
}
