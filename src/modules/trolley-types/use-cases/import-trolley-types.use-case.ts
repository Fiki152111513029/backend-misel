import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';
import { CreateTrolleyTypeUseCase } from './create-trolley-type.use-case';
import { UpdateTrolleyTypeUseCase } from './update-trolley-type.use-case';
import {
  ImportSummary,
  parseImportFile,
  runImport,
} from '../../../common/utils/import-export.util';

const TRUTHY_VALUES = new Set(['true', '1', 'yes', 'y', 'aktif', 'active']);

@Injectable()
export class ImportTrolleyTypesUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
    private readonly createTrolleyTypeUseCase: CreateTrolleyTypeUseCase,
    private readonly updateTrolleyTypeUseCase: UpdateTrolleyTypeUseCase,
  ) {}

  async execute(file: Express.Multer.File): Promise<ImportSummary> {
    const rows = await parseImportFile(file.buffer, file.originalname);
    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in the uploaded file');
    }

    // Fetched once up front — existing rows are matched by name (case-
    // insensitive) to decide create vs update (see runImport below), same
    // upsert convention as every other Import use-case in this codebase.
    const { items: existing } = await this.trolleyTypesRepository.findAll({
      page: 1,
      limit: 10_000,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    return runImport(rows, async (values) => {
      const name = values['Name']?.trim();
      if (!name) throw new Error('Name is required');
      const activeRaw = values['Active']?.trim().toLowerCase();
      const isActive = !activeRaw || TRUTHY_VALUES.has(activeRaw);

      const match = existing.find(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
      );
      if (match) {
        await this.updateTrolleyTypeUseCase.execute(match.id, {
          name,
          isActive,
        });
        return 'updated';
      }
      await this.createTrolleyTypeUseCase.execute({ name, isActive });
      return 'created';
    });
  }
}
