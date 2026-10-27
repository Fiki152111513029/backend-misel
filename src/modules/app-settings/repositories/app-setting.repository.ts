import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IAppSettingsRepository } from './app-setting-repository.interface';

@Injectable()
export class AppSettingRepository implements IAppSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Map<string, string>> {
    const rows = await this.prisma.appSetting.findMany();
    return new Map(rows.map((row) => [row.key, row.value]));
  }

  async upsertMany(entries: { key: string; value: string }[]): Promise<void> {
    if (entries.length === 0) return;
    // One transaction so a half-applied rename cannot leave the two bin
    // labels contradicting each other on screen.
    await this.prisma.$transaction(
      entries.map(({ key, value }) =>
        this.prisma.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
  }
}
