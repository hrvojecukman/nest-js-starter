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

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PropertyType, { each: true })
  typeOfProperties?: PropertyType[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  expectedNumberOfAdsPerMonth?: number;

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