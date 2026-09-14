import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import { CreateTrolleyCategoryUseCase } from './create-trolley-category.use-case';
import { UpdateTrolleyCategoryUseCase } from './update-trolley-category.use-case';
import {
  ImportSummary,
  parseImportFile,
  runImport,
} from '../../../common/utils/import-export.util';

@Injectable()
export class ImportTrolleyCategoriesUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
    private readonly createTrolleyCategoryUseCase: CreateTrolleyCategoryUseCase,
    private readonly updateTrolleyCategoryUseCase: UpdateTrolleyCategoryUseCase,
  ) {}

  async execute(file: Express.Multer.File): Promise<ImportSummary> {
    const rows = await parseImportFile(file.buffer, file.originalname);
    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in the uploaded file');
    }

    // Fetched once up front — existing rows are matched by name (case-
    // insensitive) to decide create vs update (see runImport below), same
    // upsert convention as every other Import use-case in this codebase.
    const { items: existing } = await this.trolleyCategoriesRepository.findAll({
      page: 1,
      limit: 10_000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const { items: modelCodeProcesses } =
      await this.modelCodeProcessesRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      });

    return runImport(rows, async (values) => {
      const name = values['Name']?.trim();
      if (!name) throw new Error('Name is required');
      const modelCodeProcessName = values['Model Code Process']?.trim();
      let modelCodeProcessId: string | undefined;
      if (modelCodeProcessName) {
        const process = modelCodeProcesses.find(
          (item) =>
            item.name.trim().toLowerCase() ===
            modelCodeProcessName.toLowerCase(),
        );
        if (!process) {
          throw new Error(
            `Model Code Process "${modelCodeProcessName}" was not found`,
          );
        }
        modelCodeProcessId = process.id;
      }

      const match = existing.find(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
      );
      if (match) {
        await this.updateTrolleyCategoryUseCase.execute(match.id, {
          name,
          modelCodeProcessId,
        });
        return 'updated';
      }
      await this.createTrolleyCategoryUseCase.execute({
        name,
        modelCodeProcessId,
      });
      return 'created';
    });
  }
}
