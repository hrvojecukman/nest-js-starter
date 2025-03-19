import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        Buyer: {
          select: {
            name: true,
            lastName: true,
          },
        },
        Owner: {
          select: {
            companyName: true,
          },
        },
        Developer: {
          select: {
            isLicensed: true,
            hasWafi: true,
            acceptsBanks: true,
          },
        },
        Broker: {
          select: {
            isLicensed: true,
            licenseNumber: true,
          },
        },
      },
    });

    if (!user) return null;

    // Extract role-specific details
    const roleDetails =
      user.role === Role.BUYER
        ? user.Buyer
        : user.role === Role.OWNER
          ? user.Owner
          : user.role === Role.DEVELOPER
            ? user.Developer
            : user.role === Role.BROKER
              ? user.Broker
              : {};

    // Return flattened response
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      ...roleDetails,
    };
  }
}
