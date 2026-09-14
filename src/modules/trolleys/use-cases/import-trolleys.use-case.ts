import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TrolleyStatus } from '@prisma/client';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';
import { TROLLEY_TYPES_REPOSITORY } from '../../trolley-types/repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../../trolley-types/repositories/trolley-type-repository.interface';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../../trolley-categories/repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../../trolley-categories/repositories/trolley-category-repository.interface';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import { CUSTOMERS_REPOSITORY } from '../../customers/repositories/customer-repository.interface';
import type { ICustomersRepository } from '../../customers/repositories/customer-repository.interface';
import { CreateTrolleyUseCase } from './create-trolley.use-case';
import { UpdateTrolleyUseCase } from './update-trolley.use-case';
import {
  ImportSummary,
  parseImportFile,
  runImport,
} from '../../../common/utils/import-export.util';

const STATUS_VALUES = new Set(Object.values(TrolleyStatus));

function findByNameCaseInsensitive<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  return items.find(
    (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
  );
}

@Injectable()
export class ImportTrolleysUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
    private readonly createTrolleyUseCase: CreateTrolleyUseCase,
    private readonly updateTrolleyUseCase: UpdateTrolleyUseCase,
  ) {}

  async execute(file: Express.Multer.File): Promise<ImportSummary> {
    const rows = await parseImportFile(file.buffer, file.originalname);
    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in the uploaded file');
    }

    // Fetched once up front, same upsert convention as every other Import
    // use-case in this codebase. Trolley name/code uniqueness is scoped per
    // Trolley Type (see trolley-repository.interface.ts), so existing rows
    // are matched by (name, trolleyTypeId) rather than name alone.
    const [
      { items: existing },
      { items: trolleyTypes },
      { items: trolleyCategories },
      { items: modelCodeProcesses },
      { items: customers },
    ] = await Promise.all([
      this.trolleysRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.trolleyTypesRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.trolleyCategoriesRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.modelCodeProcessesRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.customersRepository.findAll({
        page: 1,
        limit: 10_000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    ]);

    return runImport(rows, async (values) => {
      const name = values['Name']?.trim();
      if (!name) throw new Error('Name is required');
      const code = values['Code']?.trim();
      if (!code) throw new Error('Code is required');

      const trolleyTypeName = values['Trolley Type']?.trim();
      if (!trolleyTypeName) throw new Error('Trolley Type is required');
      const trolleyType = findByNameCaseInsensitive(
        trolleyTypes,
        trolleyTypeName,
      );
      if (!trolleyType) {
        throw new Error(`Trolley Type "${trolleyTypeName}" was not found`);
      }

      const statusRaw = values['Status']?.trim().toUpperCase();
      const status = statusRaw
        ? STATUS_VALUES.has(statusRaw as TrolleyStatus)
          ? (statusRaw as TrolleyStatus)
          : (() => {
              throw new Error(
                `Status must be one of: ${[...STATUS_VALUES].join(', ')}`,
              );
            })()
        : undefined;

      const trolleyCategoryName = values['Trolley Category']?.trim();
      let trolleyCategoryId: string | undefined;
      if (trolleyCategoryName) {
        const category = findByNameCaseInsensitive(
          trolleyCategories,
          trolleyCategoryName,
        );
        if (!category) {
          throw new Error(
            `Trolley Category "${trolleyCategoryName}" was not found`,
          );
        }
        trolleyCategoryId = category.id;
      }

      const droppingLocationCode =
        values['Dropping Location Code']?.trim() || undefined;

      const modelCodeProcessName = values['Model Code Process']?.trim();
      let modelCodeProcessId: string | undefined;
      if (modelCodeProcessName) {
        const process = findByNameCaseInsensitive(
          modelCodeProcesses,
          modelCodeProcessName,
        );
        if (!process) {
          throw new Error(
            `Model Code Process "${modelCodeProcessName}" was not found`,
          );
        }
        modelCodeProcessId = process.id;
      }

      const customerName = values['Customer']?.trim();
      let customerId: string | undefined;
      if (customerName) {
        const customer = findByNameCaseInsensitive(customers, customerName);
        if (!customer) {
          throw new Error(`Customer "${customerName}" was not found`);
        }
        customerId = customer.id;
      }

      const match = existing.find(
        (item) =>
          item.name.trim().toLowerCase() === name.toLowerCase() &&
          item.trolleyTypeId === trolleyType.id,
      );
      if (match) {
        await this.updateTrolleyUseCase.execute(match.id, {
          name,
          code,
          status,
          trolleyTypeId: trolleyType.id,
          trolleyCategoryId,
          droppingLocationCode,
          modelCodeProcessId,
          customerId,
        });
        return 'updated';
      }
      await this.createTrolleyUseCase.execute({
        name,
        code,
        status,
        trolleyTypeId: trolleyType.id,
        trolleyCategoryId,
        droppingLocationCode,
        modelCodeProcessId,
        customerId,
      });
      return 'created';
    });
  }
}
