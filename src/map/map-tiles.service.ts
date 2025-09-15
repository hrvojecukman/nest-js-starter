import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TilesQueryDto } from './dto/tiles.dto';
import { capForLevel, normalizeTilesForLevel } from '../utils/s2.util'; 

@Injectable()
export class MapTilesService {
  constructor(private prisma: PrismaService) {}

  async getTiles(q: TilesQueryDto) {
    const norm = normalizeTilesForLevel(q.tiles, q.level);
    const cap  = capForLevel(q.level);
    const where = this.buildWhere(q.filters);

    const rows = await this.prisma.property.findMany({
      where: { ...where, [norm.column]: { in: norm.tokens } },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        city: true,
        space: true,
        type: true,
        category: true,
        unitStatus: true,
        locationLat: true,
        locationLng: true,
        numberOfLivingRooms: true,
        numberOfRooms: true,
        numberOfKitchen: true,
        numberOfWC: true,
        numberOfFloors: true,
        streetWidth: true,
        discountPercentage: true,
        media: { select: { url: true }, take: 1, orderBy: { createdAt: 'asc' } },
        owner: {
          select: {
            role: true,
            Broker: {
              select: {
                licenseNumber: true
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' },
      take: cap,
    });

    return {
      mode: 'points',
      items: rows.map(r => this.mapToLightweightProperty(r)),
      meta: { 
        cap, 
        levelUsed: norm.column, 
        level: q.level,
        tilesCount: q.tiles.length
      },
    };
  }

  private buildWhere(f: TilesQueryDto['filters']): any {
    if (!f) return {};
    const where: any = {};
    
    if (f.search) {
      where.OR = [
        { title: { contains: f.search, mode: 'insensitive' } },
        { description: { contains: f.search, mode: 'insensitive' } }
      ];
    }
    
    if (f.types?.length) where.type = { in: f.types };
    if (f.categories?.length) where.category = { in: f.categories };
    if (f.unitStatuses?.length) where.unitStatus = { in: f.unitStatuses };
    
    if (f.cities?.length) {
      where.OR = [
        ...(where.OR ?? []),
        ...f.cities.map((c: string) => ({ city: { equals: c, mode: 'insensitive' as const } }))
      ];
    }
    
    if (f.ownerRole) where.owner = { role: f.ownerRole };
    
    if (f.minPrice != null || f.maxPrice != null) {
      where.price = {
        ...(f.minPrice != null ? { gte: f.minPrice } : {}),
        ...(f.maxPrice != null ? { lte: f.maxPrice } : {}),
      };
    }
    
    if (f.minSpace != null || f.maxSpace != null) {
      where.space = {
        ...(f.minSpace != null ? { gte: f.minSpace } : {}),
        ...(f.maxSpace != null ? { lte: f.maxSpace } : {}),
      };
    }
    
    if (f.brokerId) where.brokerId = f.brokerId;
    if (f.developerId) where.project = { developerId: f.developerId };
    if (f.projectId) where.projectId = f.projectId;
    
    return where;
  }

  private mapToLightweightProperty(property: any) {
    return {
      id: property.id,
      title: property.title,
      price: Number(property.price),
      currency: property.currency,
      city: property.city,
      space: property.space,
      type: property.type,
      category: property.category,
      unitStatus: property.unitStatus,
      location: {
        lat: property.locationLat,
        lng: property.locationLng
      },
      numberOfLivingRooms: property.numberOfLivingRooms,
      numberOfRooms: property.numberOfRooms,
      numberOfKitchen: property.numberOfKitchen,
      numberOfWC: property.numberOfWC,
      numberOfFloors: property.numberOfFloors,
      streetWidth: property.streetWidth,
      discountPercentage: property.discountPercentage,
      thumbnail: property.media[0]?.url,
      ownerRole: property.owner.role,
      brokerLicenseNumber: property.owner.Broker?.licenseNumber,
    };
  }
}
