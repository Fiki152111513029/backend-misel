import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ReleaseWarehouseCartTaskDto } from '../dto/release-warehouse-cart-task.dto';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { WAREHOUSE_CART_TASKS_REPOSITORY } from '../repositories/warehouse-cart-task-repository.interface';
import type { IWarehouseCartTasksRepository } from '../repositories/warehouse-cart-task-repository.interface';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../../warehouse-line-locations/repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../../warehouse-line-locations/repositories/warehouse-line-location-repository.interface';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../../warehouse-operator-locations/repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../../warehouse-operator-locations/repositories/warehouse-operator-location-repository.interface';

// Matches the reference Python client's order id (datetime.now().strftime("%Y%m%d%H%M%S")),
// prefixed per the Warehouse Control spec: taskId = WHT-<timestamp>.
function generateOrderId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  return `WHT-${timestamp}`;
}

// The ICS payload sample in the integration spec hardcodes priority 6 for
// Warehouse Control cart releases (unlike Mainline, which uses the
// releasing user's own User.priority).
const DEFAULT_PRIORITY = 6;

@Injectable()
export class ReleaseWarehouseCartTaskUseCase {
  constructor(
    @Inject(WAREHOUSE_CART_TASKS_REPOSITORY)
    private readonly warehouseCartTasksRepository: IWarehouseCartTasksRepository,
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(dto: ReleaseWarehouseCartTaskDto, userId: string) {
    const operatorLocation =
      await this.warehouseOperatorLocationsRepository.findByOperatorId(userId);
    if (!operatorLocation) {
      throw new BadRequestException(
        'No Warehouse Operator Location is assigned to your account',
      );
    }

    const lineLocation = await this.warehouseLineLocationsRepository.findById(
      dto.warehouseLineLocationId,
    );
    if (!lineLocation) {
      throw new BadRequestException('Warehouse Line Location not found');
    }

    // The Model Code Process is not chosen per release — it's a relation
    // set once on the Warehouse Line Location itself (via the Line
    // Locations admin page), so picking a line location is all an operator
    // needs to do here.
    const modelCodeProcess = lineLocation.modelCodeProcess;
    if (!modelCodeProcess || !modelCodeProcess.isActive) {
      throw new BadRequestException(
        'This Warehouse Line Location has no active Model Code Process assigned',
      );
    }

    // taskPath: operator location code, line location dropping code, line
    // location picking code, operator location code again (round trip).
    const taskPath = [
      operatorLocation.locationCode,
      lineLocation.droppingLocationCode,
      lineLocation.pickingLocationCode,
      operatorLocation.locationCode,
    ].join(',');

    const orderId = generateOrderId();

    await this.taskOrderService.addTask({
      modelProcessCode: modelCodeProcess.name,
      priority: DEFAULT_PRIORITY,
      fromSystem: modelCodeProcess.fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath }],
    });

    return this.warehouseCartTasksRepository.create({
      taskId: orderId,
      taskPath,
      warehouseLineLocationId: lineLocation.id,
      modelCodeProcessId: modelCodeProcess.id,
      operatorId: userId,
    });
  }
}
