import { Controller, Post, Headers, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../role/roles.decorator';
import { Role } from '@prisma/client';
import { SeedService } from './seed.service';


@Controller('admin/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async runSeed(@Headers('x-admin-seed-secret') secretHeader?: string) {
    const secret = process.env.ADMIN_CREATION_SECRET;
    if (!secret || secretHeader !== secret) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const result = await this.seedService.runDemoSeed();
    return { status: 'ok', ...(result as any) };
  }
}


