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

/**
 * Warehouse-facing notices about Custom Tasks, pushed with their details.
 *
 * Carries data rather than a signal because the notice IS the data: there
 * is nothing for Checking Area to go and fetch afterwards, and a signal
 * would only tell it that something it cannot see had happened.
 *
 * The wording is deliberately NOT built here — the server sends the facts
 * and the page writes the sentence, so changing the phrasing never needs a
 * backend deploy.
 */
export const WAREHOUSE_NOTICE_EVENT = 'warehouse:notice';
const WAREHOUSE_ROOM = 'warehouse-notices';

export interface WarehouseNotice {
  /**
   * pickup-* concerns a task collecting an empty rack FROM the warehouse;
   * drop-* concerns one delivering finished goods TO it. `-held` means it
   * is parked waiting on that bin, `-running` that it is on its way.
   */
  kind:
    | 'pickup-held'
    | 'drop-held'
    | 'pickup-running'
    | 'drop-running'
    /** The AMR has put a finish-good rack down at this warehouse node. */
    | 'drop-done';
  /** Which line asked for it — the Control Task's group, e.g. "WRL23L". */
  requester: string | null;
  /** The warehouse node the notice is about. */
  nodeCode: string;
  /** The AMR, once RCS has assigned one. */
  robotName: string | null;
  /** Lets the page ignore repeats of a notice it has already shown. */
  orderId: string;
  at: string;
}

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

      // Warehouse notices tell the floor to go and prepare a rack, so they
      // go to whoever can act on them — the people with Checking Area.
      if (payload?.permissions?.includes('checking-area.read')) {
        void client.join(WAREHOUSE_ROOM);
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

  broadcastWarehouseNotice(notice: WarehouseNotice): void {
    if (!this.server) return;
    this.server.to(WAREHOUSE_ROOM).emit(WAREHOUSE_NOTICE_EVENT, notice);
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
