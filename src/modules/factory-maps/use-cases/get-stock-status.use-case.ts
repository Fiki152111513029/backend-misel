import { Injectable } from '@nestjs/common';
import { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';

export interface StockStatusEntry {
  code: string;
  status: 'EMPTY' | 'FULL';
}

// Live full/empty status for every Warehouse/Production Location node in an
// area, straight from RCS (see RcsStockStatusService) — the Factory Map's
// source of truth for node icons, since RCS is the system other
// integrations may also write stock status into directly, not just this app.
@Injectable()
export class GetStockStatusUseCase {
  constructor(private readonly rcsStockStatusService: RcsStockStatusService) {}

  async execute(areaId: number): Promise<StockStatusEntry[]> {
    const rows = await this.rcsStockStatusService.getStockStatus(areaId);

    const entries: StockStatusEntry[] = [];
    for (const row of rows) {
      if (!row.qrContent) continue;
      if (Number(row.stockStatus) === 0) {
        entries.push({ code: row.qrContent, status: 'EMPTY' });
      } else if (Number(row.stockStatus) === 2) {
        entries.push({ code: row.qrContent, status: 'FULL' });
      }
      // Any other stockStatus value is left out — the map just falls back
      // to its plain node icon for that code rather than guessing.
    }
    return entries;
  }
}
