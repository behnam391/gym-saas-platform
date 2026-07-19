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

  it('isolates tenant state between concurrent async request chains', async () => {
    const ctx = new TenantContext();
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = ctx.run(async () => {
      ctx.tenantId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      await gate;
      return ctx.tenantId;
    });

    const second = ctx.run(async () => {
      ctx.tenantId = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
      releaseFirst();
      await Promise.resolve();
      return ctx.tenantId;
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      'c56a4180-65aa-42ec-a945-5fd21dec0538',
    ]);
  });
});
