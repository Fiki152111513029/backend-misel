import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { RealtimeTopic } from './realtime.topics';

/** The single event name clients listen on. */
export const REALTIME_EVENT = 'changed';

/**
 * Pushes "this changed" signals to the browser so the UI can stop polling.
 *
 * Deliberately not a data channel — see realtime.topics.ts. Every client
 * gets every topic; filtering is the client's job, which keeps the server
 * from having to track who is looking at which page.
 */
@WebSocketGateway({
  namespace: '/realtime',
  // The browser and the API are on different origins in every deployment
  // of this app (Nuxt on :3000, Nest on :3001, or both behind nginx), so
  // the socket handshake has to be allowed cross-origin the same way the
  // REST layer already is.
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * The signals carry no data, so a leaked one tells an eavesdropper only
   * that something changed — but an unauthenticated socket is still a free
   * side channel into how busy the floor is, and an open connection to
   * hold. The access token is checked at handshake and the socket dropped
   * if it does not verify.
   */
  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth as { token?: string } | undefined)?.token ??
      extractBearer(client.handshake.headers.authorization);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });
    } catch {
      // An expired token is the common case: the client refreshes it and
      // reconnects on its own, so this is not worth logging as an error.
      client.disconnect(true);
    }
  }

  broadcast(topic: RealtimeTopic): void {
    // Undefined until the server has finished starting; a signal raised in
    // that window is simply dropped rather than crashing the caller.
    if (!this.server) return;
    this.server.emit(REALTIME_EVENT, { topic, at: new Date().toISOString() });
  }
}

function extractBearer(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length);
}
