import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import {
  OwnerDetailsDto,
  DeveloperDetailsDto,
  BrokerDetailsDto,
  BuyerDetailsDto,
} from '../auth/dto/auth.dto';

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
            companyName: true,
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
      details.acceptsBanks === undefined ||
      !details.companyName
    ) {
      throw new BadRequestException(
        'isLicensed, hasWafi, acceptsBanks, and companyName are required for Developer',
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
          companyName: details.companyName,
        },
      });
    } else {
      await this.prisma.developer.create({
        data: {
          id: userId,
          isLicensed: details.isLicensed,
          hasWafi: details.hasWafi,
          acceptsBanks: details.acceptsBanks,
          companyName: details.companyName,
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

    if (existingBuyer) {
      return { success: false, message: 'Buyer already exists' };
    }
    await this.prisma.buyer.create({
      data: { id: userId, name: details.name, lastName: details.lastName },
    });
    return { success: true, role: Role.BUYER };
  }

  async isProfileComplete(userId: string, role: Role): Promise<boolean> {
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
