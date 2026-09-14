import { Inject, Injectable } from '@nestjs/common';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';
import {
  buildCsvBuffer,
  buildXlsxBuffer,
  ExportColumn,
} from '../../../common/utils/import-export.util';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportRow {
  name: string;
  modelCodeProcess: string;
}

const COLUMNS: ExportColumn<ExportRow>[] = [
  { header: 'Name', key: 'name' },
  { header: 'Model Code Process', key: 'modelCodeProcess' },
];

@Injectable()
export class ExportTrolleyCategoriesUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.trolleyCategoriesRepository.findAll({
      page: 1,
      limit: 10_000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const rows: ExportRow[] = items.map((item) => ({
      name: item.name,
      modelCodeProcess: item.modelCodeProcess?.name ?? '',
    }));

    if (format === 'xlsx') {
      return {
        buffer: await buildXlsxBuffer<ExportRow>(
          'Trolley Categories',
          COLUMNS,
          rows,
        ),
        filename: 'trolley-categories.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'trolley-categories.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
