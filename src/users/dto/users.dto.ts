import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export enum UsersSortField {
  CREATED_AT = 'createdAt',
  PHONE_NUMBER = 'phoneNumber',
  EMAIL = 'email',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class UsersFilterDto {
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

export class UserResponseDto {
  id: string;
  email?: string;
  phoneNumber: string;
  role: Role;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Developer fields
  isLicensed?: boolean;
  hasWafi?: boolean;
  acceptsBanks?: boolean;
  companyName?: string;
  // Broker fields
  licenseNumber?: string;
  // Buyer fields
  name?: string;
  lastName?: string;
} 