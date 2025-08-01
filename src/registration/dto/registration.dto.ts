import { IsEmail, IsOptional, IsString, IsBoolean, Matches, IsArray, IsEnum, IsNumber, Min } from 'class-validator';
import { PropertyType } from '@prisma/client';

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