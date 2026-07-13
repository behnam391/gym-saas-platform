import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no @Roles() declared -> any authenticated user
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('کاربر احراز هویت نشده است.');
    }

    // SUPER_ADMIN is intentionally NOT given an implicit bypass here.
    // Super-admin-only endpoints must explicitly list @Roles('SUPER_ADMIN').
    // This avoids accidental over-privileged access on tenant routes.
    const allowed = requiredRoles.includes(user.role);
    if (!allowed) {
      throw new ForbiddenException(
        'شما اجازه دسترسی به این بخش را ندارید.',
      );
    }
    return true;
  }
}
