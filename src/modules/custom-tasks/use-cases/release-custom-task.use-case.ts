import { Inject, Injectable, Logger } from '@nestjs/common';
import { CONTROL_TASKS_REPOSITORY } from '../../control-tasks/repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../../control-tasks/repositories/control-task-repository.interface';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { generateOrderId } from '../../tasks/utils/generate-order-id';
import { FACTORY_MAPS_REPOSITORY } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { CUSTOM_TASK_RUNS_REPOSITORY } from '../repositories/custom-task-run-repository.interface';
import type { ICustomTaskRunsRepository } from '../repositories/custom-task-run-repository.interface';
import { assertWarehouseBinsReady } from './assert-warehouse-bins-ready';
import { resolveCustomTask } from './resolve-custom-task';

@Injectable()
export class ReleaseCustomTaskUseCase {
  private readonly logger = new Logger(ReleaseCustomTaskUseCase.name);

  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
    @Inject(CUSTOM_TASK_RUNS_REPOSITORY)
    private readonly customTaskRunsRepository: ICustomTaskRunsRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(code: string, operatorId: string) {
    const { preview } = await resolveCustomTask(
      this.controlTasksRepository,
      code,
    );

    // Checked before anything is sent: a Warehouse Location on the route
    // that RCS still has as a full bin means the AMR would arrive at an
    // occupied slot, so the task is refused here instead of failing on the
    // floor. Throws BadRequest, which the scan page shows as its toast.
    await assertWarehouseBinsReady(
      {
        warehouseLocationsRepository: this.warehouseLocationsRepository,
        factoryMapsRepository: this.factoryMapsRepository,
        rcsStockStatusService: this.rcsStockStatusService,
      },
      preview.route,
    );

    // The code prefixes the usual %Y%m%d%H%M%S order id, so an order coming
    // back from RCS (or a webhook) says at a glance which Control Task it
    // came from, and two Control Tasks released in the same second cannot
    // collide on the same id.
    const orderId = `${preview.code}${generateOrderId()}`;

    await this.taskOrderService.addTask({
      modelProcessCode: preview.modelProcessCode,
      priority: preview.priority,
      fromSystem: preview.fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath: preview.taskPath }],
    });

    // Recorded only after RCS accepts it, so All Tasks > Custom Tasks
    // lists real dispatches rather than attempts that never got through.
    // The Control Task fields are snapshotted because that task can be
    // edited or deleted later, while this row must keep describing what
    // was actually sent.
    try {
      await this.customTaskRunsRepository.create({
        orderId,
        controlTaskId: preview.controlTaskId,
        code: preview.code,
        name: preview.name,
        taskPath: preview.taskPath,
        modelProcessCode: preview.modelProcessCode,
        operatorId,
      });
    } catch (error) {
      // The task is already running in RCS by now, so failing the request
      // would tell the operator it did not work and invite a duplicate.
      // Losing the history row is the lesser problem.
      this.logger.error(
        `Custom task ${orderId} was accepted by RCS but its history row could not be saved: ${error}`,
      );
    }

    return { ...preview, orderId, releasedAt: new Date() };
  }
}
