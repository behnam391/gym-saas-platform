import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';

interface TenantStore {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
  isSuperAdmin: boolean;
}

/**
 * Async-local holder of the current tenant + actor.
 * Populated by TenantContextMiddleware from the verified JWT payload —
 * NEVER from a client-supplied header/body field, to prevent tenant spoofing.
 *
 * AsyncLocalStorage keeps one singleton database pool while isolating context
 * between concurrent requests. Creating a request-scoped PrismaService would
 * create a new connection pool per HTTP request and exhaust Postgres quickly.
 */
@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantStore>();
  private readonly fallback: TenantStore = this.emptyStore();

  run<T>(callback: () => T): T {
    return this.storage.run(this.emptyStore(), callback);
  }

  private emptyStore(): TenantStore {
    return {
      tenantId: null,
      userId: null,
      role: null,
      isSuperAdmin: false,
    };
  }

  private get store(): TenantStore {
    return this.storage.getStore() ?? this.fallback;
  }

  get tenantId(): string | null {
    return this.store.tenantId;
  }

  set tenantId(value: string | null) {
    this.store.tenantId = value;
  }

  get userId(): string | null {
    return this.store.userId;
  }

  set userId(value: string | null) {
    this.store.userId = value;
  }

  get role(): string | null {
    return this.store.role;
  }

  set role(value: string | null) {
    this.store.role = value;
  }

  get isSuperAdmin(): boolean {
    return this.store.isSuperAdmin;
  }

  set isSuperAdmin(value: boolean) {
    this.store.isSuperAdmin = value;
  }

  requireTenantId(): string {
    if (!this.tenantId) {
      throw new Error(
        'TenantContext: tenantId is missing. This operation requires a tenant-scoped request.',
      );
    }
    return this.tenantId;
  }
}
