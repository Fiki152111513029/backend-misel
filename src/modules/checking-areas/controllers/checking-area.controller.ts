import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CheckingAreaQueryDto } from '../dto/checking-area-query.dto';
import { SetBinStatusDto } from '../dto/set-bin-status.dto';
import { GetCheckingAreaUseCase } from '../use-cases/get-checking-area.use-case';
import { SetBinStatusUseCase } from '../use-cases/set-bin-status.use-case';

@ApiTags('Checking Area')
@ApiBearerAuth('access-token')
@Controller('checking-areas')
export class CheckingAreaController {
  constructor(
    private readonly getCheckingAreaUseCase: GetCheckingAreaUseCase,
    private readonly setBinStatusUseCase: SetBinStatusUseCase,
  ) {}

  @Get()
  @Permissions('checking-area.read')
  @ApiOperation({
    summary:
      'Every active Warehouse Location with the bin status RCS currently reports for it — what the Checking Area page compares against the floor. Optional areaId narrows the RCS lookup to one area; omitted, every area is asked and the answers merged',
  })
  async findAll(@Query() query: CheckingAreaQueryDto) {
    const data = await this.getCheckingAreaUseCase.execute(query.areaId);
    return {
      success: true,
      message: 'Checking area retrieved successfully',
      data,
    };
  }

  @Patch(':code')
  @Permissions('checking-area.update')
  @ApiOperation({
    summary:
      'Correct one bin in RCS to match the floor — sends nodeStatus 0 (empty) or 2 (full) to RCS, then mirrors it onto our own Warehouse Location',
  })
  async setStatus(@Param('code') code: string, @Body() dto: SetBinStatusDto) {
    const data = await this.setBinStatusUseCase.execute(code, dto.status);
    return {
      success: true,
      message: `Bin ${code} marked ${dto.status === 'FULL' ? 'full' : 'empty'}`,
      data,
    };
  }
}
