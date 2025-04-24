import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto, PropertyFilterDto } from './dto/property.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto, ownerId: string) {
    return await this.prisma.property.create({
      data: {
        ...createPropertyDto,
        ownerId,
      },
      include: {
        owner: true,
        broker: true,
        project: true,
      },
    });
  }

  async findAll(filterDto: PropertyFilterDto) {
    const { page = 1, limit = 10, search, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {};

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (filters.category) where.category = filters.category;
    if (filters.type) where.type = filters.type;
    if (filters.unitStatus) where.unitStatus = filters.unitStatus;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
      };
    }
    if (filters.minSpace || filters.maxSpace) {
      where.space = {
        ...(filters.minSpace ? { gte: Number(filters.minSpace) } : {}),
        ...(filters.maxSpace ? { lte: Number(filters.maxSpace) } : {}),
      };
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: true,
          broker: true,
          project: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: true,
        broker: true,
        project: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(id: string, updatePropertyDto: Partial<CreatePropertyDto>) {
    const property = await this.findOne(id);

    return this.prisma.property.update({
      where: { id },
      data: updatePropertyDto,
      include: {
        owner: true,
        broker: true,
        project: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.property.delete({
      where: { id },
    });
  }
}
