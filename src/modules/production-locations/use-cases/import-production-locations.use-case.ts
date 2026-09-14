import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';
import { CreateProductionLocationUseCase } from './create-production-location.use-case';
import { UpdateProductionLocationUseCase } from './update-production-location.use-case';
import {
  ImportSummary,
  parseImportFile,
  runImport,
} from '../../../common/utils/import-export.util';

const TRUTHY_VALUES = new Set(['true', '1', 'yes', 'y', 'aktif', 'active']);

@Injectable()
export class ImportProductionLocationsUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    private readonly createProductionLocationUseCase: CreateProductionLocationUseCase,
    private readonly updateProductionLocationUseCase: UpdateProductionLocationUseCase,
  ) {}

  async execute(file: Express.Multer.File): Promise<ImportSummary> {
    const rows = await parseImportFile(file.buffer, file.originalname);
    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in the uploaded file');
    }

    // Fetched once up front — existing rows are matched by name (case-
    // insensitive) to decide create vs update (see runImport below), same
    // upsert convention as every other Import use-case in this codebase.
    const { items: existing } =
      await this.productionLocationsRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      });

    return runImport(rows, async (values) => {
      const name = values['Name']?.trim();
      if (!name) throw new Error('Name is required');
      const iRaypleLocationCode = values['iRayple Location Code']?.trim();
      if (!iRaypleLocationCode) {
        throw new Error('iRayple Location Code is required');
      }
      const activeRaw = values['Active']?.trim().toLowerCase();
      const isActive = !activeRaw || TRUTHY_VALUES.has(activeRaw);

      const match = existing.find(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
      );
      if (match) {
        await this.updateProductionLocationUseCase.execute(match.id, {
          name,
          iRaypleLocationCode,
          isActive,
        });
        return 'updated';
      }
      await this.createProductionLocationUseCase.execute({
        name,
        iRaypleLocationCode,
        isActive,
      });
      return 'created';
    });
  }
}
