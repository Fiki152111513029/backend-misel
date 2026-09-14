import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';
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
export class ExportProductionLocationsUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.productionLocationsRepository.findAll({
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
          'Production Locations',
          COLUMNS,
          rows,
        ),
        filename: 'production-locations.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'production-locations.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
