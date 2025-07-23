import { PropertyType, PropertyCategory, InfrastructureItem, MediaType } from '@prisma/client';
import { PropertyDto } from '../../property/dto/property.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsEnum, IsNumber, IsLatitude, IsLongitude, Min, Max } from 'class-validator';

export class MediaDto {
  url: string;
  type: MediaType;
  name?: string;
}

export class NearbyPlaceDto {
  name: string;
  distance: number;
}

export class ProjectTimelineDto {
  type: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isInProgress?: boolean;
  isCompleted?: boolean;
  progress?: number;
  notes?: string;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  city: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsEnum(PropertyCategory)
  category: PropertyCategory;

  @IsNumber()
  locationLat: number;

  @IsNumber()
  locationLng: number;

  infrastructureItems: InfrastructureItem[];
  nearbyPlaces: NearbyPlaceDto[];
  timeline?: ProjectTimelineDto[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class DeveloperDto {
  name?: string;
  profileImage?: string;
  companyName?: string;
}

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
  developer: DeveloperDto;
  amountSold: number;
  averageUnitSize: number;
}

export class ProjectDetailDto extends ProjectSummaryDto {
  description: string;
  infrastructureItems: InfrastructureItem[];
  properties: PropertyDto[];
  nearbyPlaces: NearbyPlaceDto[];
  timeline: {
    id: string;
    type: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    isInProgress: boolean;
    isCompleted: boolean;
    progress?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export enum ProjectSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  NUMBER_OF_UNITS = 'numberOfUnits',
  AVERAGE_PRICE = 'averagePrice',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ProjectFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  developerId?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number; // in kilometers

  @IsOptional()
  @IsEnum(ProjectSortField)
  sortBy?: ProjectSortField = ProjectSortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class SimilarProjectsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  typeWeight?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  categoryWeight?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  cityWeight?: number = 8;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  locationWeight?: number = 7;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  priceWeight?: number = 6;

  // Distance thresholds (in km)
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  closeDistance?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  mediumDistance?: number = 5;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  farDistance?: number = 10;

  // Price range parameters
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  priceRangePercentage?: number = 0.3; // ±30% of average price

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  priceRangeMinMultiplier?: number = 0.7; // minPrice * 0.7

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  priceRangeMaxMultiplier?: number = 1.3; // maxPrice * 1.3

  // Search radius for initial filtering
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  searchRadius?: number = 5; // km

  // Minimum similarity score threshold
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number = 0;
} 