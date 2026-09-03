import { Module } from '@nestjs/common';
import { ShiftController } from './controllers/shift.controller';
import { SHIFTS_REPOSITORY } from './repositories/shift-repository.interface';
import { ShiftRepository } from './repositories/shift.repository';
import { CreateShiftUseCase } from './use-cases/create-shift.use-case';
import { DeleteShiftUseCase } from './use-cases/delete-shift.use-case';
import { GetShiftUseCase } from './use-cases/get-shift.use-case';
import { GetShiftsUseCase } from './use-cases/get-shifts.use-case';
import { UpdateShiftUseCase } from './use-cases/update-shift.use-case';

@Module({
  controllers: [ShiftController],
  providers: [
    { provide: SHIFTS_REPOSITORY, useClass: ShiftRepository },
    CreateShiftUseCase,
    GetShiftsUseCase,
    GetShiftUseCase,
    UpdateShiftUseCase,
    DeleteShiftUseCase,
  ],
  exports: [SHIFTS_REPOSITORY],
})
export class ShiftsModule {}
