import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { InitiateLoginDto, VerifyLoginOtpDto, AdminLoginDto, AdminRegisterDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { TwilioService } from '../twilio/twilio.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

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
          name: 'User', // Temporary name until profile is completed
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

  async generateTokens(userId: string, phoneNumber: string, role: Role) {
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

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Admin account not properly configured');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.phoneNumber,
      user.role,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async adminRegister(dto: AdminRegisterDto) {
    // Check if admin already exists
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin account already exists');
    }

    // Check if email is already taken
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Create admin user
    const adminUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phoneNumber: `+1${Math.random().toString().slice(2, 12)}`, // Generate a dummy phone number
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      adminUser.id,
      adminUser.phoneNumber,
      adminUser.role,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    };
  }
}
