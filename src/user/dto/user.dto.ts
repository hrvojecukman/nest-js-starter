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
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  Buyer?: {
    name?: string;
    lastName?: string;
  };
  Developer?: {
    companyName?: string;
    isLicensed: boolean;
    hasWafi: boolean;
    acceptsBanks: boolean;
  };
  Owner?: {
    companyName?: string;
  };
  Broker?: {
    licenseNumber: string;
    isLicensed: boolean;
  };
} 