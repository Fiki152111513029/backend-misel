import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  ControlTaskWithRelations,
  IControlTasksRepository,
} from '../../control-tasks/repositories/control-task-repository.interface';

// Every RCS task order this app sends uses priority 6 (see
// ReleaseWarehouseCartTaskUseCase) — a Custom Task is no different.
export const DEFAULT_PRIORITY = 6;

export interface CustomTaskPreview {
  controlTaskId: string;
  abjad: string;
  name: string;
  route: string[];
  taskPath: string;
  modelProcessCode: string;
  fromSystem: string;
  priority: number;
}

/**
 * Turns a scanned abjad into everything the RCS task order needs, rejecting
 * anything that would be dispatched but then bounced: a retired Control Task,
 * or one whose Model Code Process has since been deactivated. Shared by the
 * lookup (what the operator confirms on screen) and the release (what is
 * actually sent), so the confirmation screen can never show one thing and
 * submit another.
 */
export async function resolveCustomTask(
  repository: IControlTasksRepository,
  abjad: string,
): Promise<{
  controlTask: ControlTaskWithRelations;
  preview: CustomTaskPreview;
}> {
  const controlTask = await repository.findByAbjad(abjad.trim());
  if (!controlTask) {
    throw new NotFoundException(`No Control Task found for "${abjad.trim()}"`);
  }
  if (!controlTask.isActive) {
    throw new BadRequestException(
      `Control Task "${controlTask.abjad}" is inactive`,
    );
  }

  const modelCodeProcess = controlTask.modelCodeProcess;
  if (!modelCodeProcess || !modelCodeProcess.isActive) {
    throw new BadRequestException(
      'This Control Task has no active Model Code Process assigned',
    );
  }

  if (controlTask.route.length === 0) {
    throw new BadRequestException('This Control Task has an empty route');
  }

  return {
    controlTask,
    preview: {
      controlTaskId: controlTask.id,
      abjad: controlTask.abjad,
      name: controlTask.name,
      route: controlTask.route,
      taskPath: controlTask.route.join(','),
      modelProcessCode: modelCodeProcess.name,
      fromSystem: modelCodeProcess.fromSystem,
      priority: DEFAULT_PRIORITY,
    },
  };
}
