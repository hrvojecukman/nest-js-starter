import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}
  @Get('healthz')
  health() {
    return { ok: true };
  }

  @Get('health/db')
  async healthDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
}


