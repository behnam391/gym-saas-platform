import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';

function makeContext(user: any, handlerRoles?: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows any authenticated user when no @Roles() is declared', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = makeContext({ userId: 'u1', role: 'ATHLETE' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException if there is no user on the request at all', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GYM_OWNER']);
    const ctx = makeContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows a user whose role is in the required list', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GYM_OWNER', 'RECEPTION']);
    const ctx = makeContext({ userId: 'u1', role: 'RECEPTION' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects a user whose role is NOT in the required list', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GYM_OWNER']);
    const ctx = makeContext({ userId: 'u1', role: 'ATHLETE' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('does NOT implicitly allow SUPER_ADMIN on a route that requires a different role', () => {
    // Critical regression guard: SUPER_ADMIN must be explicitly listed in
    // @Roles() to access a tenant-scoped route — there is no bypass here.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GYM_OWNER']);
    const ctx = makeContext({ userId: 'admin1', role: 'SUPER_ADMIN' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
