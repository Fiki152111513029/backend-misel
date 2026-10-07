import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import type { RealtimeTopic } from './realtime.topics';

/**
 * How the rest of the app announces that something changed. Injected into
 * use-cases and background services; they call publish() and never touch
 * the gateway or socket.io directly.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * Best-effort by design: a websocket that is down must never fail the
   * operation that triggered it. Clients also keep a slow fallback poll,
   * so a dropped signal costs a short delay, not stale data forever.
   */
  publish(topic: RealtimeTopic): void {
    try {
      this.gateway.broadcast(topic);
    } catch (error) {
      this.logger.warn(`Failed to publish "${topic}" over websocket: ${error}`);
    }
  }
}
