import { Inject, Injectable, Logger } from '@nestjs/common';
import { AGV_LOGS_REPOSITORY } from '../repositories/agv-log-repository.interface';
import type { IAgvLogsRepository } from '../repositories/agv-log-repository.interface';
import { RealtimeService } from '../../realtime/realtime.service';
import { RobotTelemetryService } from '../../robots/services/robot-telemetry.service';
import { RobotPositionBroadcastService } from '../../robots/services/robot-position-broadcast.service';

/** RCS treats this as "accepted"; anything else makes it retry. */
const RCS_SUCCESS = { code: 1000, msg: 'success' };

/**
 * RCS names the device differently depending on which report it sends, so
 * the first field that is present wins rather than demanding one shape.
 */
const DEVICE_FIELDS = [
  'deviceCode',
  'deviceNo',
  'deviceName',
  'deviceNumber',
  'agvCode',
  'agvNo',
  'robotCode',
] as const;

function extractDeviceCode(body: Record<string, unknown>): string | null {
  for (const field of DEVICE_FIELDS) {
    const value = body[field];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number') return String(value);
  }
  // Some reports nest the device under a `data` object.
  const data = body.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return extractDeviceCode(data as Record<string, unknown>);
  }
  return null;
}

@Injectable()
export class ReceiveAgvReportUseCase {
  private readonly logger = new Logger(ReceiveAgvReportUseCase.name);

  constructor(
    @Inject(AGV_LOGS_REPOSITORY)
    private readonly agvLogsRepository: IAgvLogsRepository,
    private readonly realtime: RealtimeService,
    private readonly robotTelemetryService: RobotTelemetryService,
    private readonly positionBroadcast: RobotPositionBroadcastService,
  ) {}

  /**
   * Stores whatever RCS sent, verbatim.
   *
   * Always answers 1000, even when our own write fails: RCS retries
   * anything else, and a retry storm caused by our database being briefly
   * unavailable is worse than losing one inspection row. The failure is
   * logged here instead.
   */
  async execute(body: Record<string, unknown>) {
    try {
      await this.agvLogsRepository.createLog({
        method: 'POST',
        endpoint: '/agv-logs',
        deviceCode: extractDeviceCode(body),
        requestPayload: body,
        responsePayload: RCS_SUCCESS,
      });
      this.realtime.publish('agv-logs');
    } catch (error) {
      this.logger.error(`Failed to store AGV report: ${error}`);
    }

    // Feed the live telemetry too, not just the log. The report carries the
    // same fields as the deviceInfo response the poller used to fetch, so
    // once robots report for themselves the poller stops calling RCS
    // entirely — see RobotTelemetryService.hasFreshPush.
    //
    // Outside the try above on purpose: a failed log write must not stop
    // the map from updating, and vice versa.
    try {
      const deviceCode = this.robotTelemetryService.ingestPushedDevice(body);
      // devicePostionRec goes straight out to every open map rather than
      // waiting for the next poller tick — this is what makes the markers
      // follow the robot without any browser asking for anything.
      if (deviceCode) this.positionBroadcast.schedule();
    } catch (error) {
      this.logger.warn(`AGV report could not be read as telemetry: ${error}`);
    }

    return RCS_SUCCESS;
  }
}
