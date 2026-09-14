import { Inject, Injectable } from '@nestjs/common';
import { PARKING_AREAS_REPOSITORY } from '../repositories/parking-area-repository.interface';
import type { IParkingAreasRepository } from '../repositories/parking-area-repository.interface';
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
export class ExportParkingAreasUseCase {
  constructor(
    @Inject(PARKING_AREAS_REPOSITORY)
    private readonly parkingAreasRepository: IParkingAreasRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.parkingAreasRepository.findAll({
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
          'Parking Areas',
          COLUMNS,
          rows,
        ),
        filename: 'parking-areas.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'parking-areas.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
