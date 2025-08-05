import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export enum UserSortField {
  CREATED_AT = 'createdAt',
  PHONE_NUMBER = 'phoneNumber',
  EMAIL = 'email',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class UserFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField = UserSortField.CREATED_AT;

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

export class UserDto {
  id: string;
  email?: string;
  phoneNumber: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  Buyer?: {
    lastName?: string;
  };
  Developer?: {
    companyName?: string;
    entityType?: string;
    developerCity?: string;
    propertyType?: string;
    annualProjectCount?: string;
    totalNumberOfUnits?: string;
    representativeName?: string;
    representativePhone?: string;
    representativePosition?: string;
    representativeEmail?: string;
    websiteUrl?: string;
    xAccountUrl?: string;
    snapchatAccountUrl?: string;
    linkedinAccountUrl?: string;    
    licenseNumber?: string;
    hasWafi?: boolean;
    acceptsBanks?: boolean;
    description?: string;
    location?: string;
  };
  Owner?: {
    lastName?: string;
    doesOwnProperty?: boolean;
    propertyType?: string;
    doesOwnPropertyWithElectronicDeed?: boolean;
    purposeOfRegistration?: number;
    developerPartnership?: number;
    lookingForDeveloperPartnership?: boolean;
  };
  Broker?: {
    lastName?: string;
    licenseNumber?: string;
    description?: string;
    propertyType?: string;
    expectedNumberOfAdsPerMonth?: number;
    hasExecutedSalesTransaction?: boolean;
    useDigitalPromotion?: boolean;
    wantsAdvertising?: boolean;
  };
} 