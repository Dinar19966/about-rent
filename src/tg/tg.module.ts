import { Module } from '@nestjs/common';
import { TgService } from './tg.service';
import { TgController } from './tg.controller';

@Module({
  providers: [TgService],
  controllers: [TgController],
  exports: [TgService],
})
export class TgModule {}
