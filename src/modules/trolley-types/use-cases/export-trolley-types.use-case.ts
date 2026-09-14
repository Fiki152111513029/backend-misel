import { Inject, Injectable } from '@nestjs/common';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';
import {
  buildCsvBuffer,
  buildXlsxBuffer,
  ExportColumn,
} from '../../../common/utils/import-export.util';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportRow {
  name: string;
  isActive: string;
}

const COLUMNS: ExportColumn<ExportRow>[] = [
  { header: 'Name', key: 'name' },
  { header: 'Active', key: 'isActive' },
];

@Injectable()
export class ExportTrolleyTypesUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.trolleyTypesRepository.findAll({
      page: 1,
      limit: 10_000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const rows: ExportRow[] = items.map((item) => ({
      name: item.name,
      isActive: item.isActive ? 'TRUE' : 'FALSE',
    }));

    if (format === 'xlsx') {
      return {
        buffer: await buildXlsxBuffer<ExportRow>(
          'Trolley Types',
          COLUMNS,
          rows,
        ),
        filename: 'trolley-types.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'trolley-types.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
