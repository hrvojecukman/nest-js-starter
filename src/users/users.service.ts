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
    };

    if (user.Developer) {
      return {
        ...baseUser,
        isLicensed: user.Developer.isLicensed,
        hasWafi: user.Developer.hasWafi,
        acceptsBanks: user.Developer.acceptsBanks,
        description: user.Developer.description || undefined,
        location: user.Developer.location || undefined,
      };
    }

    if (user.Broker) {
      return {
        ...baseUser,
        isLicensed: user.Broker.isLicensed,
        licenseNumber: user.Broker.licenseNumber,
        brokerDescription: user.Broker.description || undefined,
      };
    }

    if (user.Owner) {
      return {
        ...baseUser,
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
      isLicensed,
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
    if (developerLocation || isLicensed !== undefined || hasWafi !== undefined || acceptsBanks !== undefined) {
      where.Developer = {
        ...(developerLocation && { location: { contains: developerLocation, mode: 'insensitive' } }),
        ...(isLicensed !== undefined && { isLicensed }),
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
      brokerLicenseNumber,
      brokerDescription,
      brokerIsLicensed,
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
    if (brokerLicenseNumber || brokerDescription || brokerIsLicensed !== undefined) {
      where.Broker = {
        ...(brokerLicenseNumber && { licenseNumber: { contains: brokerLicenseNumber, mode: 'insensitive' } }),
        ...(brokerDescription && { description: { contains: brokerDescription, mode: 'insensitive' } }),
        ...(brokerIsLicensed !== undefined && { isLicensed: brokerIsLicensed }),
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