import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiateLoginDto, Role, VerifyLoginOtpDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { TwilioService } from '../twilio/twilio.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService,
    private readonly userService: UserService,
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
    const isProfileComplete = await this.userService.isProfileComplete(user.id, user.role as Role);

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

  private async generateTokens(userId: string, phoneNumber: string, role: Role) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, phoneNumber, role },
      { secret: process.env.JWT_SECRET, expiresIn: '60m' },
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
}
