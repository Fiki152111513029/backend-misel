import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// The set of real, named locations in the system — the Factory Map only
// marks topology nodes whose content matches one of these codes, instead of
// every alphanumeric-looking node in the raw export (which also includes
// internal ids like "BASE0000" that aren't meaningful locations).
@Injectable()
export class GetLocationCodesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<string[]> {
    const [
      quarantineAreas,
      eximLocations,
      emptyPalletLocations,
      productionLineAreas,
      chargerAreas,
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
    ]);

    const codes = [
      ...quarantineAreas,
      ...eximLocations,
      ...emptyPalletLocations,
      ...productionLineAreas,
      ...chargerAreas,
    ].map((row) => row.iRaypleLocationCode);

    return [...new Set(codes)];
  }
}
