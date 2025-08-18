import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { CbrSource } from './sources/cbr.source';
import { CianSource } from './sources/cian.source';

@Module({
  providers: [ParserService, CbrSource, CianSource],
  exports: [ParserService],
})
export class ParserModule {}
