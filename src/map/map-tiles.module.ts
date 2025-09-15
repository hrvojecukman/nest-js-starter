import { Module } from '@nestjs/common';
import { MapTilesController } from './map-tiles.controller';
import { MapTilesService } from './map-tiles.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MapTilesController],
  providers: [MapTilesService, PrismaService],
})
export class MapTilesModule {}
