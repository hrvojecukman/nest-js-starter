import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { CompleteRegistrationDto, InitiateLoginDto, Role, VerifyLoginOtpDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService,
  ) {}

  async register(dto: CompleteRegistrationDto, secretKey?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        phoneNumber: dto.phoneNumber,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.phoneNumber === dto.phoneNumber
          ? 'An account with this phone number already exists'
          : 'An account with this email already exists',
      );
    }

    // Verify OTP first
    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    let hashedPassword: string | null = null;
    if (dto.password) {
      hashedPassword = await argon2.hash(dto.password);
    }

    if (dto.role === Role.ADMIN) {
      if (!secretKey || secretKey !== process.env.ADMIN_CREATION_SECRET) {
        throw new UnauthorizedException('Invalid or missing admin secret key.');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        role: dto.role,
        password: hashedPassword,
      },
    });

    switch (dto.role) {
      case Role.BUYER:
        await this.prisma.buyer.create({ data: { id: user.id } });
        break;

      case Role.DEVELOPER:
        if (
          dto.isLicensed === undefined ||
          dto.hasWafi === undefined ||
          dto.acceptsBanks === undefined
        ) {
          throw new BadRequestException(
            'isLicensed, hasWafi, and acceptsBanks are required for Developer',
          );
        }
        await this.prisma.developer.create({
          data: {
            id: user.id,
            isLicensed: dto.isLicensed,
            hasWafi: dto.hasWafi,
            acceptsBanks: dto.acceptsBanks,
          },
        });
        break;

      case Role.OWNER:
        if (!dto.companyName) {
          throw new BadRequestException('Company name is required for Owner');
        }
        await this.prisma.owner.create({ data: { id: user.id, companyName: dto.companyName } });
        break;

      case Role.BROKER:
        if (dto.isLicensed === undefined || !dto.licenseNumber) {
          throw new BadRequestException('License details are required for Broker');
        }
        await this.prisma.broker.create({
          data: { id: user.id, isLicensed: dto.isLicensed, licenseNumber: dto.licenseNumber },
        });
        break;

      case Role.ADMIN:
        break;

      default:
        throw new BadRequestException('Invalid role provided');
    }

    return this.generateTokens(user.id, user.phoneNumber as string, user.role as Role);
  }

  async initiateAuth(dto: InitiateLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    // If password is provided and user exists, try password login
    if (dto.password && user) {
      if (!user.password) {
        throw new BadRequestException('This account requires OTP authentication');
      }
      if (await argon2.verify(user.password, dto.password)) {
        const tokens = await this.generateTokens(
          user.id,
          user.phoneNumber as string,
          user.role as Role,
        );
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return {
          status: 'LOGGED_IN',
          tokens,
        };
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Send OTP
    await this.twilioService.sendOtp(dto.phoneNumber);

    // Return appropriate status based on whether user exists
    return {
      status: user ? 'LOGIN_OTP_SENT' : 'REGISTRATION_OTP_SENT',
      phoneNumber: dto.phoneNumber,
    };
  }

  async verifyOtpAndLogin(dto: VerifyLoginOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.phoneNumber as string,
      user.role as Role,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { tokens };
  }

  async login(dto: InitiateLoginDto) {
    return this.initiateAuth(dto);
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

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.phoneNumber as string,
      user.role as Role,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
