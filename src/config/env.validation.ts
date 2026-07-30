import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

class EnvironmentVariables {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  ROBOT_TELEMETRY_URL?: string;

  @IsOptional()
  @IsString()
  ROBOT_TELEMETRY_DEVICE_TYPE?: string;

  @IsOptional()
  @IsString()
  ROBOT_CONTROL_URL?: string;

  @IsOptional()
  @IsString()
  TASK_ORDER_URL?: string;

  @IsOptional()
  @IsString()
  TASK_ORDER_GET_ORDER_LIST_URL?: string;

  @IsOptional()
  @IsString()
  TASK_ORDER_AREA_ID?: string;

  @IsOptional()
  @IsString()
  ICS_LOGS_DEVELOPER_PASSWORD?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
