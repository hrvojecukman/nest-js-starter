import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';

export enum UsersSortField {
  CREATED_AT = 'createdAt',
  PHONE_NUMBER = 'phoneNumber',
  EMAIL = 'email',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// Base filter DTO with common fields
export class BaseUserFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UsersSortField)
  sortBy?: UsersSortField = UsersSortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

// Developer specific filter DTO
export class DeveloperFilterDto extends BaseUserFilterDto {
  @IsOptional()
  @IsString()
  developerLocation?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  hasLicense?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWafi?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsBanks?: boolean;
}

// Broker specific filter DTO
export class BrokerFilterDto extends BaseUserFilterDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  hasLicense?: boolean;

  @IsOptional()
  @IsString()
  brokerDescription?: string;

  @IsOptional()
  @IsBoolean()
  hasExecutedSalesTransaction?: boolean;

  @IsOptional()
  @IsBoolean()
  useDigitalPromotion?: boolean;

  @IsOptional()
  @IsBoolean()
  wantsAdvertising?: boolean;
}
export class UserResponseDto {
  id: string;
  email?: string;
  phoneNumber: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  licenseNumber?: string;
  hasLicense?: boolean;
  profileImage?: string;
  // Developer fields
  hasWafi?: boolean;
  acceptsBanks?: boolean;
  description?: string;
  location?: string;
  // Broker fields
  brokerDescription?: string;
  typeOfProperties?: string[];
  expectedNumberOfAdsPerMonth?: number;
  hasExecutedSalesTransaction?: boolean;
  useDigitalPromotion?: boolean;
  wantsAdvertising?: boolean;
  // Buyer fields
  lastName?: string;
} 