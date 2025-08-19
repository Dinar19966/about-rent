import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { FactsRepository } from './facts.repository.js';

@Module({
  providers: [PrismaService, FactsRepository],
  exports: [FactsRepository, PrismaService],
})
export class FactsModule {}