import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AgvLogQueryDto } from '../dto/agv-log-query.dto';
import { GetAgvLogsUseCase } from '../use-cases/get-agv-logs.use-case';
import { ReceiveAgvReportUseCase } from '../use-cases/receive-agv-report.use-case';
import { AGV_LOGS_REPOSITORY } from '../repositories/agv-log-repository.interface';
import type { IAgvLogsRepository } from '../repositories/agv-log-repository.interface';

@ApiTags('AGV Logs')
@Controller('agv-logs')
export class AgvLogController {
  constructor(
    private readonly receiveAgvReportUseCase: ReceiveAgvReportUseCase,
    private readonly getAgvLogsUseCase: GetAgvLogsUseCase,
    @Inject(AGV_LOGS_REPOSITORY)
    private readonly agvLogsRepository: IAgvLogsRepository,
  ) {}

  // Called by RCS itself, not our frontend — no JWT, so this must stay
  // @Public(). Accepts any JSON body: the point is to capture whatever RCS
  // sends, including shapes we have not seen yet.
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Endpoint to register with RCS for AGV reports. Stores the raw call and always answers { code: 1000 }',
  })
  async receive(@Body() body: Record<string, unknown>) {
    return this.receiveAgvReportUseCase.execute(body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Permissions('agv-log.read')
  @ApiOperation({ summary: 'List received AGV reports (pagination, filter by device and day)' })
  async findAll(@Query() query: AgvLogQueryDto) {
    const data = await this.getAgvLogsUseCase.execute(query);
    return {
      success: true,
      message: 'AGV logs retrieved successfully',
      data,
    };
  }

  @Get('device-codes')
  @ApiBearerAuth('access-token')
  @Permissions('agv-log.read')
  @ApiOperation({ summary: 'Device codes seen in the stored reports — the filter dropdown' })
  async deviceCodes() {
    const data = await this.agvLogsRepository.findDeviceCodes();
    return {
      success: true,
      message: 'AGV device codes retrieved successfully',
      data,
    };
  }
}
