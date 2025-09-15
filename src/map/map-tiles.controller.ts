import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { TilesQueryDto } from './dto/tiles.dto';
import { MapTilesService } from './map-tiles.service';

@Controller('map')
export class MapTilesController {
  constructor(private svc: MapTilesService) {}

  @Get('tiles')
  get(@Query(new ValidationPipe({ transform: true })) q: TilesQueryDto) {
    return this.svc.getTiles(q);
  }
}
