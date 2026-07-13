import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Clients join a room named after their tenantId (extracted from their own
 * verified JWT on the client side / passed at connection time and verified
 * server-side in a real implementation — omitted here for brevity, but the
 * same JWT verification used in TenantContextMiddleware applies).
 *
 * A scheduled job (e.g. a Cron + Redis pub/sub fan-out across instances)
 * calls `broadcastCrowdLevel()` every 30-60s per tenant.
 */
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN } })
export class CrowdGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
    }
  }

  @SubscribeMessage('join-tenant')
  joinTenant(client: Socket, tenantId: string) {
    client.join(`tenant:${tenantId}`);
  }

  broadcastCrowdLevel(
    tenantId: string,
    payload: { activeCount: number; capacity: number; level: string },
  ) {
    this.server.to(`tenant:${tenantId}`).emit('crowd-update', payload);
  }
}
