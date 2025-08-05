import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseUserFilterDto, UserResponseDto, DeveloperFilterDto, BrokerFilterDto } from './dto/users.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private flattenUserResponse(user: any): UserResponseDto {
    const baseUser = {
      id: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileImage: user.profileImage || undefined,
    };

    if (user.Developer) {
      return {
        ...baseUser,
        companyName: user.Developer.companyName || undefined,
        entityType: user.Developer.entityType || undefined,
        developerCity: user.Developer.developerCity || undefined,
        developerPropertyType: user.Developer.propertyType || undefined,
        annualProjectCount: user.Developer.annualProjectCount || undefined,
        totalNumberOfUnits: user.Developer.totalNumberOfUnits || undefined,
        representativeName: user.Developer.representativeName || undefined,
        representativePhone: user.Developer.representativePhone || undefined,
        representativePosition: user.Developer.representativePosition || undefined,
        representativeEmail: user.Developer.representativeEmail || undefined,
        websiteUrl: user.Developer.websiteUrl || undefined,
        xAccountUrl: user.Developer.xAccountUrl || undefined,
        snapchatAccountUrl: user.Developer.snapchatAccountUrl || undefined,
        linkedinAccountUrl: user.Developer.linkedinAccountUrl || undefined,
        licenseNumber: user.Developer.licenseNumber || undefined,
        hasWafi: user.Developer.hasWafi || undefined,
        acceptsBanks: user.Developer.acceptsBanks || undefined,
        description: user.Developer.description || undefined,
        location: user.Developer.location || undefined,
      };
    }

    if (user.Broker) {
      return {
        ...baseUser,
        licenseNumber: user.Broker.licenseNumber || undefined,
        brokerDescription: user.Broker.description || undefined,
        brokerLastName: user.Broker.lastName || undefined,
        brokerPropertyType: user.Broker.propertyType || undefined,
        expectedNumberOfAdsPerMonth: user.Broker.expectedNumberOfAdsPerMonth || undefined,
        hasExecutedSalesTransaction: user.Broker.hasExecutedSalesTransaction || undefined,
        useDigitalPromotion: user.Broker.useDigitalPromotion || undefined,
        wantsAdvertising: user.Broker.wantsAdvertising || undefined,
      };
    }

    if (user.Owner) {
      return {
        ...baseUser,
        ownerLastName: user.Owner.lastName || undefined,
        doesOwnProperty: user.Owner.doesOwnProperty || undefined,
        propertyType: user.Owner.propertyType || undefined,
        doesOwnPropertyWithElectronicDeed: user.Owner.doesOwnPropertyWithElectronicDeed || undefined,
        purposeOfRegistration: user.Owner.purposeOfRegistration || undefined,
        developerPartnership: user.Owner.developerPartnership || undefined,
        lookingForDeveloperPartnership: user.Owner.lookingForDeveloperPartnership || undefined,
      };
    }

    if (user.Buyer) {
      return {
        ...baseUser,
        lastName: user.Buyer.lastName || undefined,
      };
    }

    return baseUser;
  }

  async findAll(filterDto: BaseUserFilterDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;
    
    // Convert string values to numbers for pagination
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { Buyer: { lastName: { contains: search, mode: 'insensitive' } } },
        { Developer: { location: { contains: search, mode: 'insensitive' } } },
        { Developer: { description: { contains: search, mode: 'insensitive' } } },
        { Broker: { description: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          Buyer: true,
          Developer: true,
          Owner: true,
          Broker: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const flattenedUsers = users.map(user => this.flattenUserResponse(user));

    return {
      data: flattenedUsers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMorePages: pageNum < Math.ceil(total / limitNum),
      },
    };
  }

  // Cleaner methods for specific user types
  async findAllDevelopers(filterDto: DeveloperFilterDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      developerLocation,
      licenseNumber,
      hasLicense,
      hasWafi,
      acceptsBanks,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;
    
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {
      role: Role.DEVELOPER,
    };

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { Developer: { location: { contains: search, mode: 'insensitive' } } },
        { Developer: { description: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Developer specific filters
    if (developerLocation || licenseNumber || hasLicense !== undefined || hasWafi !== undefined || acceptsBanks !== undefined) {
      where.Developer = {
        ...(developerLocation && { location: { contains: developerLocation, mode: 'insensitive' } }),
        ...(licenseNumber && { licenseNumber: { contains: licenseNumber, mode: 'insensitive' } }),
        ...(hasLicense !== undefined && { 
          licenseNumber: hasLicense ? { not: null } : null 
        }),
        ...(hasWafi !== undefined && { hasWafi }),
        ...(acceptsBanks !== undefined && { acceptsBanks }),
      };
    }

    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          Developer: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const flattenedUsers = users.map(user => this.flattenUserResponse(user));

    return {
      data: flattenedUsers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMorePages: pageNum < Math.ceil(total / limitNum),
      },
    };
  }

  async findAllBrokers(filterDto: BrokerFilterDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      licenseNumber,
      brokerDescription,
      hasExecutedSalesTransaction,
      useDigitalPromotion,
      wantsAdvertising,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;
    
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {
      role: Role.BROKER,
    };

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { Broker: { licenseNumber: { contains: search, mode: 'insensitive' } } },
        { Broker: { description: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Broker specific filters
    if (licenseNumber || brokerDescription || hasExecutedSalesTransaction !== undefined || useDigitalPromotion !== undefined || wantsAdvertising !== undefined) {
      where.Broker = {
        ...(licenseNumber && { licenseNumber: { contains: licenseNumber, mode: 'insensitive' } }),
        ...(brokerDescription && { description: { contains: brokerDescription, mode: 'insensitive' } }),
        ...(hasExecutedSalesTransaction !== undefined && { hasExecutedSalesTransaction }),
        ...(useDigitalPromotion !== undefined && { useDigitalPromotion }),
        ...(wantsAdvertising !== undefined && { wantsAdvertising }),
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          Broker: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const flattenedUsers = users.map(user => this.flattenUserResponse(user));

    return {
      data: flattenedUsers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMorePages: pageNum < Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        Buyer: true,
        Developer: true,
        Owner: true,
        Broker: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.flattenUserResponse(user);
  }
} 