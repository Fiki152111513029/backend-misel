import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface LocationCodesResult {
  // All real, named locations in the system — the Factory Map only marks
  // topology nodes whose content matches one of these codes, instead of
  // every alphanumeric-looking node in the raw export (which also includes
  // internal ids like "BASE0000" that aren't meaningful locations).
  codes: string[];
  // Subset of `codes` that belong to a Charger Area specifically, so the
  // Factory Map can render a distinct charger icon for those nodes instead
  // of the generic location icon.
  chargerCodes: string[];
}

@Injectable()
export class GetLocationCodesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<LocationCodesResult> {
    const [
      quarantineAreas,
      eximLocations,
      emptyPalletLocations,
      productionLineAreas,
      chargerAreas,
      warehouseLocations,
      productionLocations,
    ] = await Promise.all([
      this.prisma.quarantineArea.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
      this.prisma.eximLocation.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
      this.prisma.emptyPalletLocation.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
      this.prisma.productionLineArea.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
      this.prisma.chargerArea.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
      this.prisma.warehouseLocation.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
      this.prisma.productionLocation.findMany({
        where: { deletedAt: null },
        select: { iRaypleLocationCode: true },
      }),
    ]);

    const codes = [
      ...quarantineAreas,
      ...eximLocations,
      ...emptyPalletLocations,
      ...productionLineAreas,
      ...chargerAreas,
      ...warehouseLocations,
      ...productionLocations,
    ].map((row) => row.iRaypleLocationCode);

    const chargerCodes = chargerAreas.map((row) => row.iRaypleLocationCode);

    return {
      codes: [...new Set(codes)],
      chargerCodes: [...new Set(chargerCodes)],
    };
  }
}
