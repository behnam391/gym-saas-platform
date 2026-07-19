import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../tenant-context';

/**
 * Runs after JwtAuthGuard's strategy has already validated the token's
 * signature/expiry on protected routes; here we only need to read the
 * (already-trusted) payload back off the request and hydrate the
 * request-scoped TenantContext used by PrismaService.
 *
 * IMPORTANT: tenantId is taken ONLY from the JWT payload — never from
 * a header, query param, or body field — so a compromised/curious client
 * cannot impersonate another tenant by editing a request.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly tenantContext: TenantContext,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    this.tenantContext.run(() => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice('Bearer '.length);
          // Verified (not just decoded) — throws on bad signature/expiry.
          const payload = this.jwt.verify(token, {
            secret: process.env.JWT_ACCESS_SECRET,
          });
          this.tenantContext.userId = payload.sub;
          this.tenantContext.role = payload.role;
          this.tenantContext.tenantId = payload.tenantId ?? null;
          this.tenantContext.isSuperAdmin = payload.role === 'SUPER_ADMIN';
        } catch {
          // Invalid/expired token: leave context empty. Route guards reject
          // protected requests while public marketplace routes still work.
        }
      }
      next();
    });
  }
}
