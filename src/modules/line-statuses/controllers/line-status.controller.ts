import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { RaiseLineStatusDto } from '../dto/raise-line-status.dto';
import { ClearLineStatusUseCase } from '../use-cases/clear-line-status.use-case';
import { GetLineStatusesUseCase } from '../use-cases/get-line-statuses.use-case';
import { RaiseLineStatusUseCase } from '../use-cases/raise-line-status.use-case';

@ApiTags('Line Status')
@ApiBearerAuth('access-token')
@Controller('line-statuses')
export class LineStatusController {
  constructor(
    private readonly getLineStatusesUseCase: GetLineStatusesUseCase,
    private readonly raiseLineStatusUseCase: RaiseLineStatusUseCase,
    private readonly clearLineStatusUseCase: ClearLineStatusUseCase,
  ) {}

  // Read is gated by checking-area.read rather than a permission of its
  // own: this exists for the Checking Area board, and a new permission
  // would mean every role that already has that page being re-granted
  // before the feature works for anyone.
  @Get()
  @Permissions('checking-area.read')
  @ApiOperation({
    summary:
      'What every production line is currently announcing — one row per line, newest first. The Checking Area board',
  })
  async findAll() {
    const data = await this.getLineStatusesUseCase.execute();
    return {
      success: true,
      message: 'Line statuses retrieved successfully',
      data,
    };
  }

  // Written from the Custom Task picker, so it carries that page's own
  // create permission — the same one releasing a Custom Task needs.
  @Post()
  @Permissions('custom-task.create')
  @ApiOperation({
    summary:
      'Announce what this line is doing (Running LH/RH) or asking for (Ganti LH/RH). Replaces whatever that line was saying before; the caller must have a task in the group with the buttons switched on',
  })
  async raise(
    @CurrentUser() user: AuthRequestUser,
    @Body() dto: RaiseLineStatusDto,
  ) {
    const data = await this.raiseLineStatusUseCase.execute(
      user.userId,
      dto.groupName,
      dto.kind,
    );
    return { success: true, message: 'Line status updated', data };
  }

  @Delete(':groupName')
  @Permissions('checking-area.update')
  @ApiOperation({
    summary:
      'Clear what one line is saying, once the warehouse has dealt with it',
  })
  async clear(@Param('groupName') groupName: string) {
    const data = await this.clearLineStatusUseCase.execute(groupName);
    return { success: true, message: 'Line status cleared', data };
  }
}
