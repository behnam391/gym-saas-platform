import { TenantContext } from '../tenant-context';

describe('TenantContext', () => {
  it('returns the tenantId when it is set', () => {
    const ctx = new TenantContext();
    ctx.tenantId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    expect(ctx.requireTenantId()).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  });

  it('throws when tenantId is null — this is what stops an accidental cross-tenant query', () => {
    const ctx = new TenantContext();
    ctx.tenantId = null;
    expect(() => ctx.requireTenantId()).toThrow();
  });

  it('defaults isSuperAdmin to false and tenantId to null for a fresh context', () => {
    const ctx = new TenantContext();
    expect(ctx.isSuperAdmin).toBe(false);
    expect(ctx.tenantId).toBeNull();
  });
});
