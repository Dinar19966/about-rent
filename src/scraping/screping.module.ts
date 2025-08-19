// scraping.module.ts
import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
