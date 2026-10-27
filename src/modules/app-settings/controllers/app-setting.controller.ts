import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UpdateAppSettingsDto } from '../dto/update-app-settings.dto';
import { GetAppSettingsUseCase } from '../use-cases/get-app-settings.use-case';
import { UpdateAppSettingsUseCase } from '../use-cases/update-app-settings.use-case';

@ApiTags('App Settings')
@ApiBearerAuth('access-token')
@Controller('app-settings')
export class AppSettingController {
  constructor(
    private readonly getAppSettingsUseCase: GetAppSettingsUseCase,
    private readonly updateAppSettingsUseCase: UpdateAppSettingsUseCase,
  ) {}

  // Readable by any signed-in user: these are the words on their own
  // screens, and gating them would just leave labels blank.
  @Get()
  @ApiOperation({ summary: 'All settings, with defaults filled in' })
  async findAll() {
    const data = await this.getAppSettingsUseCase.execute();
    return { success: true, message: 'Settings retrieved successfully', data };
  }

  @Put()
  @Permissions('setting.update')
  @ApiOperation({ summary: 'Change one or more settings' })
  async update(@Body() dto: UpdateAppSettingsDto) {
    const data = await this.updateAppSettingsUseCase.execute(dto.settings);
    return { success: true, message: 'Settings updated successfully', data };
  }
}
