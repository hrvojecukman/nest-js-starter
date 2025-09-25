import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seedDemo } from '../seed';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async runDemoSeed() {
    this.logger.log('Running DEMO seed...');
    await seedDemo(this.prisma);
    this.logger.log('Seeder finished.');
  }
}