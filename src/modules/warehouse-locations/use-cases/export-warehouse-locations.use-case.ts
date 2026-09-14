import { Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../repositories/warehouse-location-repository.interface';
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
export class ExportWarehouseLocationsUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.warehouseLocationsRepository.findAll({
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
          'Warehouse Locations',
          COLUMNS,
          rows,
        ),
        filename: 'warehouse-locations.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'warehouse-locations.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
