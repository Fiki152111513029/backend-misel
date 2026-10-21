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
 * Robot positions, pushed with the data attached rather than as a bare
 * signal.
 *
 * Every other topic stays signal-only on purpose (see realtime.topics.ts).
 * Positions are the exception because they are the one thing that has to
 * arrive every second: as a signal, each tick made *every* open browser
 * fetch the whole robot list over HTTP, so the cost of a faster map scaled
 * with the number of screens. Carrying the handful of fields the map draws
 * turns that into one small push regardless of how many are watching.
 */
export const ROBOT_POSITIONS_EVENT = 'robots:positions';

/** Only sockets whose token carries robot.read join this room. */
const ROBOT_ROOM = 'robots';

export interface RobotPosition {
  id: string;
  areaId: number | null;
  x: number;
  y: number;
  orientation: number;
  state: string | null;
  battery: number | null;
  payload: string | null;
}

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
      const payload = this.jwtService.verify<{ permissions?: string[] }>(
        token,
        {
          secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
        },
      );

      // Positions carry real data, so unlike the bare signals they are only
      // sent to sockets whose token grants robot.read — the same permission
      // the REST endpoint demands. Everyone else stays out of the room and
      // simply never receives them.
      if (payload?.permissions?.includes('robot.read')) {
        void client.join(ROBOT_ROOM);
      }
    } catch {
      // An expired token is the common case: the client refreshes it and
      // reconnects on its own, so this is not worth logging as an error.
      client.disconnect(true);
    }
  }

  /**
   * Fire-and-forget: positions are superseded a second later, so a push
   * that misses is not worth retrying or reporting.
   */
  broadcastRobotPositions(robots: RobotPosition[]): void {
    if (!this.server) return;
    this.server.to(ROBOT_ROOM).emit(ROBOT_POSITIONS_EVENT, { robots });
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
