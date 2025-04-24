import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  PropertyType,
  PropertyCategory,
  UnitStatus,
  FacingDirection,
  MediaType,
  InfrastructureItem,
} from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsInt()
  @Min(0)
  @Max(100)
  downPaymentPercentage: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  cashBackPercentage?: number;

  @IsString()
  @IsNotEmpty()
  cityDis: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsInt()
  @IsNotEmpty()
  space: number;

  @IsInt()
  @IsNotEmpty()
  numberOfLivingRooms: number;

  @IsInt()
  @IsNotEmpty()
  numberOfRooms: number;

  @IsInt()
  @IsNotEmpty()
  numberOfKitchen: number;

  @IsInt()
  @IsNotEmpty()
  numberOfWC: number;

  @IsInt()
  @IsNotEmpty()
  numberOfFloors: number;

  @IsInt()
  @IsNotEmpty()
  streetWidth: number;

  @IsInt()
  @IsNotEmpty()
  age: number;

  @IsEnum(FacingDirection)
  @IsNotEmpty()
  facing: FacingDirection;

  @IsEnum(PropertyType)
  @IsNotEmpty()
  type: PropertyType;

  @IsEnum(PropertyCategory)
  @IsNotEmpty()
  category: PropertyCategory;

  @IsEnum(UnitStatus)
  @IsNotEmpty()
  unitStatus: UnitStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsEnum(MediaType, { each: true })
  @IsOptional()
  mediaTypes?: MediaType[];

  @IsArray()
  @IsEnum(InfrastructureItem, { each: true })
  @IsOptional()
  infrastructureItems?: InfrastructureItem[];

  @IsLatitude()
  @IsNotEmpty()
  locationLat: number;

  @IsLongitude()
  @IsNotEmpty()
  locationLng: number;

  @IsString()
  @IsOptional()
  projectId?: string;
}

export class PropertyFilterDto {
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
  @IsEnum(UnitStatus)
  unitStatus?: UnitStatus;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  minSpace?: number;

  @IsOptional()
  @IsNumber()
  maxSpace?: number;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}
