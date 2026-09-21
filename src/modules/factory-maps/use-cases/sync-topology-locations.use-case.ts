import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { CHARGER_AREAS_REPOSITORY } from '../../charger-areas/repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../../charger-areas/repositories/charger-area-repository.interface';
import { PARKING_AREAS_REPOSITORY } from '../../parking-areas/repositories/parking-area-repository.interface';
import type { IParkingAreasRepository } from '../../parking-areas/repositories/parking-area-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import {
  extractTopologyLocations,
  type TopologyLocation,
} from '../utils/topology-locations';

export type RackTarget = 'PRODUCTION' | 'WAREHOUSE';

export interface RackAssignment {
  code: string;
  target: RackTarget;
}

export interface LocationSyncSummary {
  created: number;
  skipped: number;
  failed: number;
  errors: { code: string; error: string }[];
}

export interface TopologySyncResult {
  chargerAreas: LocationSyncSummary;
  parkingAreas: LocationSyncSummary;
  productionLocations: LocationSyncSummary;
  warehouseLocations: LocationSyncSummary;
}

// The slice of each location repository this needs — all four (Charger Area,
// Parking Area, Production Location, Warehouse Location) share this exact
// shape.
interface LocationRepository {
  existsByLocationCode(code: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  create(data: {
    name: string;
    iRaypleLocationCode: string;
    isActive?: boolean;
  }): Promise<unknown>;
}

@Injectable()
export class SyncTopologyLocationsUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
    @Inject(PARKING_AREAS_REPOSITORY)
    private readonly parkingAreasRepository: IParkingAreasRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  /**
   * Creates Charger Areas / Parking Areas / Production Locations / Warehouse
   * Locations straight from an uploaded topology file: every type-6 node
   * becomes a Charger Area, every type-7 node a Parking Area, and every
   * type-1 rack that `assignments` routes to PRODUCTION or WAREHOUSE becomes
   * that kind of location (racks with no assignment are left alone). Node
   * `content` is the iRayple Location Code, node `name` is the Name. A code
   * that already exists is skipped, not overwritten.
   */
  async execute(
    topologyFilePath: string,
    assignments: RackAssignment[],
  ): Promise<TopologySyncResult> {
    const topology: unknown = JSON.parse(
      await readFile(topologyFilePath, 'utf-8'),
    );
    const { chargers, parkings, racks } = extractTopologyLocations(topology);

    // Only codes that really are racks in this file count — the client's
    // list is a hint for which rack goes where, not a source of new codes.
    const targetByCode = new Map(
      assignments.map((assignment) => [assignment.code, assignment.target]),
    );
    const racksFor = (target: RackTarget) =>
      racks.filter((rack) => targetByCode.get(rack.code) === target);

    return {
      chargerAreas: await this.syncGroup(chargers, this.chargerAreasRepository),
      parkingAreas: await this.syncGroup(parkings, this.parkingAreasRepository),
      productionLocations: await this.syncGroup(
        racksFor('PRODUCTION'),
        this.productionLocationsRepository,
      ),
      warehouseLocations: await this.syncGroup(
        racksFor('WAREHOUSE'),
        this.warehouseLocationsRepository,
      ),
    };
  }

  private async syncGroup(
    locations: TopologyLocation[],
    repository: LocationRepository,
  ): Promise<LocationSyncSummary> {
    const summary: LocationSyncSummary = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const location of locations) {
      try {
        if (await repository.existsByLocationCode(location.code)) {
          summary.skipped += 1;
          continue;
        }
        if (await repository.existsByName(location.name)) {
          throw new Error(`Name "${location.name}" is already in use`);
        }
        await repository.create({
          name: location.name,
          iRaypleLocationCode: location.code,
          isActive: true,
        });
        summary.created += 1;
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({
          code: location.code,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return summary;
  }
}
