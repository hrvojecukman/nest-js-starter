import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InitiateLoginDto,
  Role,
  VerifyLoginOtpDto,
  OwnerDetailsDto,
  DeveloperDetailsDto,
  BrokerDetailsDto,
  BuyerDetailsDto,
} from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService,
  ) {}

  async initiateAuth(dto: InitiateLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    // Send OTP
    await this.twilioService.sendOtp(dto.phoneNumber);

    // Return appropriate status based on whether user exists
    return {
      status: user ? 'LOGIN_OTP_SENT' : 'REGISTRATION_OTP_SENT',
      phoneNumber: dto.phoneNumber,
    };
  }

  async verifyOtpAndLogin(dto: VerifyLoginOtpDto) {
    // Verify OTP first
    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    // If user doesn't exist, create a minimal user record
    if (!user) {
      const role = dto.role || Role.BUYER; // Default to BUYER if no role provided

      const newUser = await this.prisma.user.create({
        data: {
          phoneNumber: dto.phoneNumber,
          role: role,
        },
      });

      const { accessToken, refreshToken } = await this.generateTokens(
        newUser.id,
        newUser.phoneNumber,
        role,
      );

      return {
        accessToken,
        refreshToken,
        isProfileComplete: false,
      };
    }

    // Check if profile is complete based on role
    const isProfileComplete = await this.isProfileComplete(user.id, user.role as Role);

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.phoneNumber,
      user.role as Role,
    );

    return {
      accessToken,
      refreshToken,
      isProfileComplete,
    };
  }

  async updateRoleDetails(
    userId: string,
    details: OwnerDetailsDto | DeveloperDetailsDto | BrokerDetailsDto | BuyerDetailsDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    switch (user.role) {
      case Role.OWNER:
        return this.updateOwnerDetails(userId, details as OwnerDetailsDto);
      case Role.DEVELOPER:
        return this.updateDeveloperDetails(userId, details as DeveloperDetailsDto);
      case Role.BROKER:
        return this.updateBrokerDetails(userId, details as BrokerDetailsDto);
      case Role.BUYER:
        return this.updateBuyerDetails(userId, details as BuyerDetailsDto);
      case Role.ADMIN:
        return { success: true, role: Role.ADMIN };
      default:
        throw new BadRequestException('Invalid role');
    }
  }

  private async updateOwnerDetails(userId: string, details: OwnerDetailsDto) {
    if (!details.companyName) {
      throw new BadRequestException('Company name is required for Owner');
    }

    const existingOwner = await this.prisma.owner.findUnique({
      where: { id: userId },
    });

    if (existingOwner) {
      await this.prisma.owner.update({
        where: { id: userId },
        data: { companyName: details.companyName },
      });
    } else {
      await this.prisma.owner.create({
        data: { id: userId, companyName: details.companyName },
      });
    }

    return { success: true, role: Role.OWNER };
  }

  private async updateDeveloperDetails(userId: string, details: DeveloperDetailsDto) {
    if (
      details.isLicensed === undefined ||
      details.hasWafi === undefined ||
      details.acceptsBanks === undefined
    ) {
      throw new BadRequestException(
        'isLicensed, hasWafi, and acceptsBanks are required for Developer',
      );
    }

    const existingDeveloper = await this.prisma.developer.findUnique({
      where: { id: userId },
    });

    if (existingDeveloper) {
      await this.prisma.developer.update({
        where: { id: userId },
        data: {
          isLicensed: details.isLicensed,
          hasWafi: details.hasWafi,
          acceptsBanks: details.acceptsBanks,
        },
      });
    } else {
      await this.prisma.developer.create({
        data: {
          id: userId,
          isLicensed: details.isLicensed,
          hasWafi: details.hasWafi,
          acceptsBanks: details.acceptsBanks,
        },
      });
    }

    return { success: true, role: Role.DEVELOPER };
  }

  private async updateBrokerDetails(userId: string, details: BrokerDetailsDto) {
    if (details.isLicensed === undefined || !details.licenseNumber) {
      throw new BadRequestException('License details are required for Broker');
    }

    const existingBroker = await this.prisma.broker.findUnique({
      where: { id: userId },
    });

    if (existingBroker) {
      await this.prisma.broker.update({
        where: { id: userId },
        data: {
          isLicensed: details.isLicensed,
          licenseNumber: details.licenseNumber,
        },
      });
    } else {
      await this.prisma.broker.create({
        data: {
          id: userId,
          isLicensed: details.isLicensed,
          licenseNumber: details.licenseNumber,
        },
      });
    }

    return { success: true, role: Role.BROKER };
  }

  private async updateBuyerDetails(userId: string, details: BuyerDetailsDto) {
    const existingBuyer = await this.prisma.buyer.findUnique({
      where: { id: userId },
    });

    if (!existingBuyer) {
      await this.prisma.buyer.create({
        data: { id: userId, name: details.name, lastName: details.lastName },
      });
    }

    return { success: true, role: Role.BUYER };
  }

  private async generateTokens(userId: string, phoneNumber: string, role: Role) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, phoneNumber, role },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role as Role);
    return tokens;
  }

  logout() {
    return { success: true };
  }

  private async isProfileComplete(userId: string, role: Role): Promise<boolean> {
    switch (role) {
      case Role.BUYER: {
        const buyer = await this.prisma.buyer.findUnique({
          where: { id: userId },
        });
        return !!buyer?.name;
      }

      case Role.OWNER: {
        const owner = await this.prisma.owner.findUnique({
          where: { id: userId },
        });
        return !!owner?.companyName;
      }

      case Role.DEVELOPER: {
        const developer = await this.prisma.developer.findUnique({
          where: { id: userId },
        });
        return (
          developer !== null &&
          developer.isLicensed !== undefined &&
          developer.hasWafi !== undefined &&
          developer.acceptsBanks !== undefined
        );
      }

      case Role.BROKER: {
        const broker = await this.prisma.broker.findUnique({
          where: { id: userId },
        });
        return broker !== null && broker.isLicensed !== undefined && !!broker.licenseNumber;
      }

      case Role.ADMIN:
        return true; // Admin is always complete

      default:
        return false;
    }
  }
}
