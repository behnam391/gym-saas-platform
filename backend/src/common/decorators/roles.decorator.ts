import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Usage: @Roles('GYM_OWNER', 'RECEPTION')
 * Combine with @UseGuards(JwtAuthGuard, RolesGuard) on the controller/route.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
