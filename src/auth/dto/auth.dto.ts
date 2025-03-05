import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, Matches } from 'class-validator';

export enum Role {
  BUYER = 'BUYER',
  DEVELOPER = 'DEVELOPER',
  OWNER = 'OWNER',
  BROKER = 'BROKER',
  ADMIN = 'ADMIN',
}

export class InitiateRegistrationDto {
  @IsEmail()
  email: string;

  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;

  @IsEnum(Role)
  role!: Role;
}

export class CompleteRegistrationDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  role!: Role;

  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +14155552671)',
  })
  phoneNumber: string;

  @IsString()
  otpCode: string;

  // Role-specific fields
  @IsOptional()
  @IsBoolean()
  isLicensed?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWafi?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsBanks?: boolean;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

export class InitiateLoginDto {
  @IsOptional()
  @IsString()
  password?: string;

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
}
