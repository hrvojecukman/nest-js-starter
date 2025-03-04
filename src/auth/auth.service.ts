/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import * as argon2 from 'argon2';
import { AuthDto, Role } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: AuthDto & { role: Role }, secretKey?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('An account with this email already exists.');

    const hashedPassword = await argon2.hash(dto.password);

    if (dto.role === Role.ADMIN) {
      if (!secretKey || secretKey !== process.env.ADMIN_CREATION_SECRET) {
        throw new UnauthorizedException('Invalid or missing admin secret key.');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
      },
    });

    switch (dto.role) {
      case Role.BUYER:
        if (!dto.phoneNumber) {
          throw new BadRequestException('Phone number is required for Buyer');
        }
        await this.prisma.buyer.create({ data: { id: user.id, phoneNumber: dto.phoneNumber } });
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

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await argon2.verify(user.password, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
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
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access Denied');

    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user.id, user.email);
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
