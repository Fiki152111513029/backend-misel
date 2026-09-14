import { Inject, Injectable } from '@nestjs/common';
import { WEBHOOK_LOGS_REPOSITORY } from '../../webhook-logs/repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../../webhook-logs/repositories/webhook-log-repository.interface';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from '../services/robot-telemetry.service';

export interface FleetStatusRow {
  unitId: string;
  status: string | null;
  mission: string | null;
  load: string | null;
  battery: number | null;
}

@Injectable()
export class GetFleetStatusUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  async execute(): Promise<FleetStatusRow[]> {
    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const withTelemetry =
      await this.robotTelemetryService.mergeByDevice(robots);

    return Promise.all(
      withTelemetry.map(async (robot) => {
        // Mission reflects a DB-tracked task order, which can still be
        // PENDING/IN_PROGRESS even while the robot itself is momentarily
        // doing something else (e.g. topping up battery mid-task) — shown
        // regardless of live state, that read as contradictory ("Carrying
        // Trolley" next to a Status of "InCharging"). Only surface it while
        // the robot's own live telemetry state actually says it's running a
        // task, matching the loose "task" substring match used elsewhere
        // for this same field (see robot-status-category.ts).
        const isInTask = (robot.state ?? '').toLowerCase().includes('task');
        return {
          unitId: robot.amrDeviceSerialNo,
          status: robot.state,
          mission: isInTask ? await this.resolveMission(robot.id) : null,
          load: robot.payload,
          battery: robot.battery,
        };
      }),
    );
  }

  // Live off the raw webhook payload for this robot's currently active
  // Task/WarehouseCartTask, resolved to the Model Code Process's own wording
  // for that step — same rule as the Mainline Current Queue card. Null (not
  // a bare subTaskSeq number) means "no mission right now".
  private async resolveMission(robotId: string): Promise<string | null> {
    const taskId =
      await this.webhookLogsRepository.findActiveTaskIdByRobotId(robotId);
    if (!taskId) return null;

    const log = await this.webhookLogsRepository.findLatestByOrderId(taskId);
    if (!log) return null;

    const payload =
      log.requestPayload && typeof log.requestPayload === 'object'
        ? (log.requestPayload as Record<string, unknown>)
        : {};
    const subTaskSeqRaw = payload.subTaskSeq;
    const subTaskSeq =
      subTaskSeqRaw != null && subTaskSeqRaw !== ''
        ? String(subTaskSeqRaw)
        : null;
    if (!subTaskSeq) return null;

    const modelProcessCodeName =
      await this.webhookLogsRepository.findModelProcessCodeNameByOrderId(
        taskId,
      );
    if (!modelProcessCodeName) return null;

    return this.webhookLogsRepository.findStatusComment(
      modelProcessCodeName,
      Number(subTaskSeq),
    );
  }
}
