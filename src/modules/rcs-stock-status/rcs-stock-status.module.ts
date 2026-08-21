import { Module } from '@nestjs/common';
import { RcsStockStatusService } from './rcs-stock-status.service';

@Module({
  providers: [RcsStockStatusService],
  exports: [RcsStockStatusService],
})
export class RcsStockStatusModule {}
