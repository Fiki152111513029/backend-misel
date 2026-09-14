import { Inject, Injectable } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';
import {
  buildCsvBuffer,
  buildXlsxBuffer,
  ExportColumn,
} from '../../../common/utils/import-export.util';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportRow {
  name: string;
  code: string;
  status: string;
  trolleyType: string;
  trolleyCategory: string;
  droppingLocationCode: string;
  modelCodeProcess: string;
  customer: string;
}

const COLUMNS: ExportColumn<ExportRow>[] = [
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Status', key: 'status' },
  { header: 'Trolley Type', key: 'trolleyType' },
  { header: 'Trolley Category', key: 'trolleyCategory' },
  { header: 'Dropping Location Code', key: 'droppingLocationCode' },
  { header: 'Model Code Process', key: 'modelCodeProcess' },
  { header: 'Customer', key: 'customer' },
];

@Injectable()
export class ExportTrolleysUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
  ) {}

  async execute(
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { items } = await this.trolleysRepository.findAll({
      page: 1,
      limit: 10_000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const rows: ExportRow[] = items.map((item) => ({
      name: item.name,
      code: item.code,
      status: item.status,
      trolleyType: item.type.name,
      trolleyCategory: item.category?.name ?? '',
      droppingLocationCode: item.droppingLocationCode ?? '',
      modelCodeProcess: item.modelCodeProcess?.name ?? '',
      customer: item.customer?.name ?? '',
    }));

    if (format === 'xlsx') {
      return {
        buffer: await buildXlsxBuffer<ExportRow>('Trolleys', COLUMNS, rows),
        filename: 'trolleys.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
    return {
      buffer: buildCsvBuffer<ExportRow>(COLUMNS, rows),
      filename: 'trolleys.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
