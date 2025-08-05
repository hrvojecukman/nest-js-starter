import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, Matches, IsArray, IsNumber, Min } from 'class-validator';
import { PropertyType, EntityType, AnnualProjectCount, TotalNumberOfUnits } from '@prisma/client';

export enum Role {
  BUYER = 'BUYER',
  DEVELOPER = 'DEVELOPER',
  OWNER = 'OWNER',
  BROKER = 'BROKER',
  ADMIN = 'ADMIN',
}



export class InitiateLoginDto {
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;
}

export class VerifyLoginOtpDto {
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;

  @IsString()
  otpCode: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateProfileDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class BasicProfileDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;
}

export class BuyerDetailsDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;
}

export class DeveloperDetailsDto {
  @IsString()
  name: string;

  // Company info (required)
  @IsString()
  companyName: string;

  @IsEnum(EntityType)
  entityType: EntityType;

  @IsString()
  developerCity: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsEnum(AnnualProjectCount)
  annualProjectCount: AnnualProjectCount;

  @IsEnum(TotalNumberOfUnits)
  totalNumberOfUnits: TotalNumberOfUnits;

  // Representative info (required)
  @IsString()
  representativeName: string;

  @IsString()
  representativePhone: string;

  @IsString()
  representativePosition: string;

  @IsEmail()
  representativeEmail: string;

  // Social/Contact (optional)
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  xAccountUrl?: string;

  @IsOptional()
  @IsString()
  snapchatAccountUrl?: string;

  @IsOptional()
  @IsString()
  linkedinAccountUrl?: string;

  // Existing fields (optional)
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  hasWafi?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsBanks?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class BrokerDetailsDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @IsString()
  licenseNumber: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsNumber()
  @Min(1)
  expectedNumberOfAdsPerMonth: number;

  @IsBoolean()
  hasExecutedSalesTransaction: boolean;

  @IsBoolean()
  useDigitalPromotion: boolean;

  @IsBoolean()
  wantsAdvertising: boolean;
}

export class OwnerDetailsDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @IsBoolean()
  doesOwnProperty: boolean;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsBoolean()
  doesOwnPropertyWithElectronicDeed: boolean;

  @IsNumber()
  @Min(1)
  purposeOfRegistration: number;

  @IsNumber()
  @Min(1)
  developerPartnership: number;

  @IsBoolean()
  lookingForDeveloperPartnership: boolean;
}


