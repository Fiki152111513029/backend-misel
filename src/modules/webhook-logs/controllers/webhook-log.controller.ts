import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { WebhookLogQueryDto } from '../dto/webhook-log-query.dto';
import { GetWebhookLogsUseCase } from '../use-cases/get-webhook-logs.use-case';
import { ReceiveTaskStatusWebhookUseCase } from '../use-cases/receive-task-status-webhook.use-case';

@ApiTags('Webhook Logs')
@Controller('webhooks-logs')
export class WebhookLogController {
  constructor(
    private readonly receiveTaskStatusWebhookUseCase: ReceiveTaskStatusWebhookUseCase,
    private readonly getWebhookLogsUseCase: GetWebhookLogsUseCase,
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
}
