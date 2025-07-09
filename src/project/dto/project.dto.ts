import { PropertyType, PropertyCategory, InfrastructureItem, MediaType } from '@prisma/client';
import { PropertyDto } from '../../property/dto/property.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';

export class MediaDto {
  url: string;
  type: MediaType;
  name?: string;
}

export class NearbyPlaceDto {
  name: string;
  distance: number;
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

  infrastructureItems: InfrastructureItem[];
  nearbyPlaces: NearbyPlaceDto[];
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