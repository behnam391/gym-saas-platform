import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  tenantId: string | null;
}

/**
 * Usage: findAll(@CurrentUser() user: AuthenticatedUser)
 * Pulls the verified JWT payload that Passport's JwtStrategy attached to
 * the request — never trust any other source for identity/role/tenant.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
