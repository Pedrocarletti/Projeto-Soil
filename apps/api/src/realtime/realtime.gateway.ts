import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('Realtime gateway ready.');
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      client.data.user = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.configService.get('JWT_SECRET') ?? 'soil-secret',
      });
    } catch {
      this.logger.warn(
        `Rejected realtime connection from ${client.handshake.address}: invalid token.`,
      );
      client.disconnect(true);
      return;
    }

    const pivotId = client.handshake.query.pivotId;

    if (typeof pivotId === 'string' && pivotId) {
      client.join(`pivot:${pivotId}`);
    }
  }

  @SubscribeMessage('pivot.join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { pivotId?: string },
  ) {
    if (payload.pivotId) {
      client.join(`pivot:${payload.pivotId}`);
    }
  }

  emitPivotSnapshot(payload: unknown) {
    this.server.emit('pivot.snapshot', payload);
  }

  emitPivotDetail(pivotId: string, payload: unknown) {
    this.server.to(`pivot:${pivotId}`).emit('pivot.detail', payload);
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization !== 'string') {
      return null;
    }

    return authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : authorization.trim();
  }
}
