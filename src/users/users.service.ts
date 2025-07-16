import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersFilterDto, UserResponseDto } from './dto/users.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private flattenUserResponse(user: any): UserResponseDto {
    const baseUser = {
      id: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber,
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
        companyName: user.Developer.companyName || undefined,
      };
    }

    if (user.Broker) {
      return {
        ...baseUser,
        isLicensed: user.Broker.isLicensed,
        licenseNumber: user.Broker.licenseNumber,
      };
    }

    if (user.Owner) {
      return {
        ...baseUser,
        companyName: user.Owner.companyName || undefined,
      };
    }

    if (user.Buyer) {
      return {
        ...baseUser,
        name: user.Buyer.name || undefined,
        lastName: user.Buyer.lastName || undefined,
      };
    }

    return baseUser;
  }

  async findAll(filterDto: UsersFilterDto) {
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
        { Developer: { companyName: { contains: search, mode: 'insensitive' } } },
        { Owner: { companyName: { contains: search, mode: 'insensitive' } } },
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