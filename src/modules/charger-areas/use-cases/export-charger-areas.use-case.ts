import { Inject, Injectable } from '@nestjs/common';
import { CHARGER_AREAS_REPOSITORY } from '../repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../repositories/charger-area-repository.interface';
import {
  buildCsvBuffer,
  buildXlsxBuffer,
  ExportColumn,
} from '../../../common/utils/import-export.util';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportRow {
  name: string;
  iRaypleLocationCode: string;
  isActive: string;
}

const COLUMNS: ExportColumn<ExportRow>[] = [
  { header: 'Name', key: 'name' },
  { header: 'iRayple Location Code', key: 'iRaypleLocationCode' },
  { header: 'Active', key: 'isActive' },
];

@Injectable()
export class ExportChargerAreasUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.chargerAreasRepository.findAll({
      page: 1,
      limit: 10_000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const rows: ExportRow[] = items.map((item) => ({
      name: item.name,
      iRaypleLocationCode: item.iRaypleLocationCode,
      isActive: item.isActive ? 'TRUE' : 'FALSE',
    }));

    if (format === 'xlsx') {
      return {
        buffer: await buildXlsxBuffer<ExportRow>(
          'Charger Areas',
          COLUMNS,
          rows,
        ),
        filename: 'charger-areas.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'charger-areas.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
