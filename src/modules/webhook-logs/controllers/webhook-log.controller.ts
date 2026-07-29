import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { WebhookLogQueryDto } from '../dto/webhook-log-query.dto';
import { GetLatestWebhookStatusUseCase } from '../use-cases/get-latest-webhook-status.use-case';
import { GetWebhookLogsUseCase } from '../use-cases/get-webhook-logs.use-case';
import { ReceiveTaskStatusWebhookUseCase } from '../use-cases/receive-task-status-webhook.use-case';

@ApiTags('Webhook Logs')
@Controller('webhooks-logs')
export class WebhookLogController {
  constructor(
    private readonly receiveTaskStatusWebhookUseCase: ReceiveTaskStatusWebhookUseCase,
    private readonly getWebhookLogsUseCase: GetWebhookLogsUseCase,
    private readonly getLatestWebhookStatusUseCase: GetLatestWebhookStatusUseCase,
  ) {}

  // Called by RCS itself (not our frontend) — no JWT, so this must stay
  // @Public(). Always responds { code: 1000 } — see the use-case for why.
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "RCS's own task-status-report webhook (see docs/apiwebhook.md) — updates our Task/WarehouseCartTask status and logs the raw call",
  })
  async receive(@Body() body: Record<string, unknown>) {
    return this.receiveTaskStatusWebhookUseCase.execute(body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List received webhook calls (pagination)' })
  async findAll(@Query() query: WebhookLogQueryDto) {
    const data = await this.getWebhookLogsUseCase.execute(query);
    return {
      success: true,
      message: 'Webhook logs retrieved successfully',
      data,
    };
  }

  @Get('latest')
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'orderId', required: true })
  @ApiOperation({
    summary:
      "Latest webhook call for a given orderId (=Task/WarehouseCartTask taskId), read live off the raw payload — status/subTaskSeq are never denormalized into our own tables",
  })
  async findLatest(@Query('orderId') orderId?: string) {
    if (!orderId) {
      throw new BadRequestException('orderId query param is required');
    }
    const data = await this.getLatestWebhookStatusUseCase.execute(orderId);
    return {
      success: true,
      message: 'Latest webhook status retrieved successfully',
      data,
    };
  }
}
