import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { ReceiveRobotAlarmWebhookUseCase } from '../use-cases/receive-robot-alarm-webhook.use-case';

// Separate top-level path from /robot-alarms (the authenticated read
// endpoints) so this exact URL — {APP_PUBLIC_URL}/webhooks-alarms — can be
// handed to whoever configures RCS's alarm webhook, matching the sibling
// /webhooks-logs convention for the existing task-status webhook.
@ApiTags('Webhook Alarms')
@Controller('webhooks-alarms')
export class RobotAlarmWebhookController {
  constructor(
    private readonly receiveRobotAlarmWebhookUseCase: ReceiveRobotAlarmWebhookUseCase,
  ) {}

  // Called by RCS itself (not our frontend) — no JWT, so this must stay
  // @Public(). Always responds { code: 1000 } — see the use-case for why.
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "RCS's device-alarm webhook (device offline, etc.) — stores every call as a RobotAlarm row and logs the raw call",
  })
  async receive(@Body() body: Record<string, unknown>) {
    return this.receiveRobotAlarmWebhookUseCase.execute(body);
  }
}
