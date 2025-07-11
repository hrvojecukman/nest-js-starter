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

export class OwnerDetailsDto {
  @IsString()
  companyName: string;
}

export class DeveloperDetailsDto {
  @IsBoolean()
  isLicensed: boolean;

  @IsBoolean()
  hasWafi: boolean;

  @IsBoolean()
  acceptsBanks: boolean;

  @IsString()
  companyName: string;
}

export class BrokerDetailsDto {
  @IsBoolean()
  isLicensed: boolean;

  @IsString()
  licenseNumber: string;
}
