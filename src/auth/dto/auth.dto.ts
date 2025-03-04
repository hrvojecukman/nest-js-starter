import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export enum Role {
  BUYER = 'BUYER',
  DEVELOPER = 'DEVELOPER',
  OWNER = 'OWNER',
  BROKER = 'BROKER',
  ADMIN = 'ADMIN',
}

export class AuthDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  role!: Role;

  // Buyer Fields
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // Developer Fields
  @IsOptional()
  @IsBoolean()
  isLicensed?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWafi?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsBanks?: boolean;

  // Owner Fields
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}
