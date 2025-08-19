import { Controller, Get, Query } from '@nestjs/common';
import { WriteService } from './write.service.js';

@Controller('write')
export class WriteController {
  constructor(private write: WriteService) {}

  @Get('region-brief')
  async generate(@Query('region') region = 'RU-MOW', @Query('period') period = '2025-07') {
    const article = await this.write.writeRegionBrief(region, period);
    return article;
  }
}