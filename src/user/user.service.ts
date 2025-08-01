import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { Role } from '@prisma/client';
import {
  OwnerDetailsDto,
  DeveloperDetailsDto,
  BrokerDetailsDto,
  BuyerDetailsDto,
} from '../auth/dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        name: true,
        profileImage: true,
        role: true,
        createdAt: true,
        Buyer: {
          select: {
            lastName: true,
          },
        },
        Owner: true,
        Developer: {
          select: {
            hasWafi: true,
            acceptsBanks: true,
            description: true,
            location: true,
          },
        },
        Broker: {
          select: {
            lastName: true,
            licenseNumber: true,
            description: true,
            typeOfProperties: true,
            expectedNumberOfAdsPerMonth: true,
            hasExecutedSalesTransaction: true,
            useDigitalPromotion: true,
            wantsAdvertising: true,
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
      name: user.name,
      profileImage: user.profileImage,
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

    // Update user name if provided in details
    if ('name' in details && details.name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name: details.name },
      });
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
    const existingOwner = await this.prisma.owner.findUnique({
      where: { id: userId },
    });

    if (existingOwner) {
      return { success: true, role: Role.OWNER };
    } else {
      await this.prisma.owner.create({
        data: { id: userId },
      });
    }

    return { success: true, role: Role.OWNER };
  }

  private async updateDeveloperDetails(userId: string, details: DeveloperDetailsDto) {
    if (
      details.hasWafi === undefined ||
      details.acceptsBanks === undefined
    ) {
      throw new BadRequestException(
        'hasWafi and acceptsBanks are required for Developer',
      );
    }

    const existingDeveloper = await this.prisma.developer.findUnique({
      where: { id: userId },
    });

    if (existingDeveloper) {
      await this.prisma.developer.update({
        where: { id: userId },
        data: {
          licenseNumber: details.licenseNumber,
          hasWafi: details.hasWafi,
          acceptsBanks: details.acceptsBanks,
          description: details.description,
          location: details.location,
        },
      });
    } else {
      await this.prisma.developer.create({
        data: {
          id: userId,
          licenseNumber: details.licenseNumber,
          hasWafi: details.hasWafi,
          acceptsBanks: details.acceptsBanks,
          description: details.description,
          location: details.location,
        },
      });
    }

    return { success: true, role: Role.DEVELOPER };
  }

  private async updateBrokerDetails(userId: string, details: BrokerDetailsDto) {
    const existingBroker = await this.prisma.broker.findUnique({
      where: { id: userId },
    });

    if (existingBroker) {
      await this.prisma.broker.update({
        where: { id: userId },
        data: {
          lastName: details.lastName,
          licenseNumber: details.licenseNumber,
          description: details.description,
          typeOfProperties: details.typeOfProperties,
          expectedNumberOfAdsPerMonth: details.expectedNumberOfAdsPerMonth,
          hasExecutedSalesTransaction: details.hasExecutedSalesTransaction,
          useDigitalPromotion: details.useDigitalPromotion,
          wantsAdvertising: details.wantsAdvertising,
        },
      });
    } else {
      await this.prisma.broker.create({
        data: {
          id: userId,
          lastName: details.lastName,
          licenseNumber: details.licenseNumber,
          description: details.description,
          typeOfProperties: details.typeOfProperties,
          expectedNumberOfAdsPerMonth: details.expectedNumberOfAdsPerMonth,
          hasExecutedSalesTransaction: details.hasExecutedSalesTransaction,
          useDigitalPromotion: details.useDigitalPromotion,
          wantsAdvertising: details.wantsAdvertising,
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
    
    // Create Buyer record (name is already updated in main method)
    await this.prisma.buyer.create({
      data: { id: userId, lastName: details.lastName },
    });
    
    return { success: true, role: Role.BUYER };
  }

  async isProfileComplete(userId: string, role: Role): Promise<boolean> {
    switch (role) {
      case Role.BUYER: {
        const buyer = await this.prisma.buyer.findUnique({
          where: { id: userId },
        });
        return !!buyer?.lastName;
      }

      case Role.OWNER: {
        const owner = await this.prisma.owner.findUnique({
          where: { id: userId },
        });
        return !!owner;
      }

      case Role.DEVELOPER: {
        const developer = await this.prisma.developer.findUnique({
          where: { id: userId },
        });
        return (
          developer !== null &&
          developer.hasWafi !== undefined &&
          developer.acceptsBanks !== undefined
        );
      }

      case Role.BROKER: {
        const broker = await this.prisma.broker.findUnique({
          where: { id: userId },
        });
        return (
          broker !== null &&
          broker.typeOfProperties !== null &&
          broker.expectedNumberOfAdsPerMonth !== null &&
          broker.hasExecutedSalesTransaction !== null &&
          broker.useDigitalPromotion !== null &&
          broker.wantsAdvertising !== null
        );
      }

      case Role.ADMIN:
        return true; // Admin is always complete

      default:
        return false;
    }
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImage: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      // Extract key from URL (assuming S3 URL format)
      const oldKey = user.profileImage.split('/').pop();
      if (oldKey) {
        try {
          await this.s3Service.deleteImage(`users/${oldKey}`);
        } catch (error) {
          // Ignore error if file doesn't exist
          console.log('Old profile image not found, skipping deletion');
        }
      }
    }

    // Upload new image
    const { url, key } = await this.s3Service.uploadImage(file, 'users');

    // Update user profile image
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: url },
      include: {
        Buyer: true,
        Developer: true,
        Owner: true,
        Broker: true,
      },
    });

    return {
      ...updatedUser,
      profileImage: url
    };
  }

  async deleteProfileImage(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImage: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profileImage) {
      throw new BadRequestException('No profile image to delete');
    }

    // Delete from S3
    const oldKey = user.profileImage.split('/').pop();
    if (oldKey) {
      try {
        await this.s3Service.deleteImage(`users/${oldKey}`);
      } catch (error) {
        console.log('Profile image not found in S3, continuing with database update');
      }
    }

    // Update user to remove profile image
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      include: {
        Buyer: true,
        Developer: true,
        Owner: true,
        Broker: true,
      },
    });

    return {
      ...updatedUser,
      profileImage: null
    };
  }

  async getProfileImage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImage: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      profileImage: user.profileImage
    };
  }
}
