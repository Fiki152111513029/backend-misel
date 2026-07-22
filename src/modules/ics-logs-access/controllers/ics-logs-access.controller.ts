import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerifyIcsLogsPasswordDto } from '../dto/verify-ics-logs-password.dto';
import { VerifyIcsLogsPasswordUseCase } from '../use-cases/verify-ics-logs-password.use-case';

@ApiTags('ICS Logs Access')
@ApiBearerAuth('access-token')
@Controller('ics-logs-access')
export class IcsLogsAccessController {
  constructor(
    private readonly verifyIcsLogsPasswordUseCase: VerifyIcsLogsPasswordUseCase,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verify the extra developer password required to view API Logs / Webhook Logs',
  })
  verify(@Body() dto: VerifyIcsLogsPasswordDto) {
    const data = this.verifyIcsLogsPasswordUseCase.execute(dto);
    return {
      success: true,
      message: 'Password verified',
      data,
    };
  }
}
