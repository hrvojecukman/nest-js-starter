import { PropertyType, PropertyCategory, InfrastructureItem, MediaType } from '@prisma/client';
import { PropertyDto } from '../../property/dto/property.dto';
import { PartialType } from '@nestjs/mapped-types';

export class MediaDto {
  url: string;
  type: MediaType;
}

export class NearbyPlaceDto {
  name: string;
  distance: number;
}

export class CreateProjectDto {
  name: string;
  description?: string;
  city: string;
  type: PropertyType;
  category: PropertyCategory;
  infrastructureItems: InfrastructureItem[];
  nearbyPlaces: NearbyPlaceDto[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectSummaryDto {
  id: string;
  name: string;
  city: string;
  type: PropertyType;
  category: PropertyCategory;
  media: MediaDto[];
  numberOfUnits: number;
  numberOfAvailableUnits: number;
  averageUnitPrice: number;
  percentSold: number;
  developerName: string;
}

export class ProjectDetailDto extends ProjectSummaryDto {
  description: string;
  infrastructureItems: InfrastructureItem[];
  properties: PropertyDto[];
  nearbyPlaces: NearbyPlaceDto[];
} 