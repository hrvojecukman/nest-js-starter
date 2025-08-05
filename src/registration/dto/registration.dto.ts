import { IsEmail, IsOptional, IsString, IsBoolean, Matches, IsEnum, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { PropertyType, EntityType, AnnualProjectCount, TotalNumberOfUnits } from '@prisma/client';

export class InitiateRegistrationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;
}

export class RegisterBrokerDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;

  @IsString()
  otpCode: string;

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

export class RegisterOwnerDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;

  @IsString()
  otpCode: string;

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

export class RegisterDeveloperDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;

  @IsString()
  otpCode: string;

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