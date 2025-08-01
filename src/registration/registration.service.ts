import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { TwilioService } from '../twilio/twilio.service';
import { AuthService } from '../auth/auth.service';
import { InitiateRegistrationDto, RegisterBrokerDto } from './dto/registration.dto';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly authService: AuthService,
  ) {}

  private async checkUserExists(phoneNumber: string, email?: string) {
    const existingUserByPhone = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUserByPhone) {
      throw new ConflictException('User with this phone number already exists');
    }

    if (email) {
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

      if (existingUserByEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }
  }

  async initiateRegistration(dto: InitiateRegistrationDto) {
    // Check if user already exists
    await this.checkUserExists(dto.phoneNumber, dto.email);

    // Send OTP
    await this.twilioService.sendOtp(dto.phoneNumber);

    return {
      status: 'REGISTRATION_OTP_SENT',
      phoneNumber: dto.phoneNumber,
    };
  }

  async registerBroker(dto: RegisterBrokerDto) {
    // Verify OTP first
    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if user already exists
    await this.checkUserExists(dto.phoneNumber, dto.email);

    // Create user with broker details
    const newUser = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        name: dto.name,
        role: Role.BROKER,
        Broker: {
          create: {
            lastName: dto.lastName,
            licenseNumber: dto.licenseNumber,
            description: dto.description,
            typeOfProperties: dto.typeOfProperties,
            expectedNumberOfAdsPerMonth: dto.expectedNumberOfAdsPerMonth,
            hasExecutedSalesTransaction: dto.hasExecutedSalesTransaction,
            useDigitalPromotion: dto.useDigitalPromotion,
            wantsAdvertising: dto.wantsAdvertising,
          },
        },
      },
      include: {
        Broker: true,
      },
    });

    // Use auth service to generate tokens
    const tokens = await this.authService.generateTokens(
      newUser.id,
      newUser.phoneNumber,
      Role.BROKER,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        broker: newUser.Broker,
      },
    };
  }
} 