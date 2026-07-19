import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * Clients join only the room encoded in their verified access token. A
 * client-supplied tenant id is never trusted, preventing cross-gym crowd
 * monitoring even if a browser tampers with the WebSocket handshake.
 *
 * A scheduled job (e.g. a Cron + Redis pub/sub fan-out across instances)
 * calls `broadcastCrowdLevel()` every 30-60s per tenant.
 */
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN } })
export class CrowdGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const authToken = client.handshake.auth?.token;
    const authorization = client.handshake.headers.authorization;
    const token =
      typeof authToken === 'string'
        ? authToken
        : typeof authorization === 'string' && authorization.startsWith('Bearer ')
          ? authorization.slice(7)
          : null;
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string; role: string; tenantId: string | null }>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      if (!payload.tenantId) {
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
      client.data.tenantId = payload.tenantId;
      client.join(`tenant:${payload.tenantId}`);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join-tenant')
  joinTenant(client: Socket) {
    const tenantId = client.data.tenantId;
    if (typeof tenantId !== 'string') {
      client.disconnect(true);
      return { joined: false };
    }
    client.join(`tenant:${tenantId}`);
    return { joined: true, tenantId };
  }

  broadcastCrowdLevel(
    tenantId: string,
    payload: { activeCount: number; capacity: number; level: string },
  ) {
    this.server.to(`tenant:${tenantId}`).emit('crowd-update', payload);
  }
}
