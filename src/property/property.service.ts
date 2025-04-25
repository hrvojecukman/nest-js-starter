import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto, PropertyFilterDto } from './dto/property.dto';
import { Prisma, MediaType } from '@prisma/client';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, ownerId: string) {
    const { brokerId, projectId, ...propertyData } = createPropertyDto;
    
    // Check if user exists and has appropriate role
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'OWNER' && user.role !== 'DEVELOPER') {
      throw new BadRequestException('Only owners and developers can create properties');
    }

    const property = await this.prisma.property.create({
      data: {
        ...propertyData,
        owner: {
          connect: { id: ownerId }
        },
        ...(brokerId && {
          broker: {
            connect: { id: brokerId }
          }
        }),
        ...(projectId && {
          project: {
            connect: { id: projectId }
          }
        })
      },
      include: {
        owner: {
          select: {
            id: true,
            phoneNumber: true,
            Owner: {
              select: {
                companyName: true
              }
            },
            Developer: {
              select: {
                companyName: true
              }
            }
          },
        },
        broker: {
          select: {
            id: true,
            phoneNumber: true,
          },
        },
        project: true,
        media: true,
      },
    });

    // Transform the response to flatten the owner structure
    return {
      ...property,
      owner: {
        id: property.owner.id,
        phoneNumber: property.owner.phoneNumber,
        companyName: property.owner.Owner?.companyName || property.owner.Developer?.companyName
      }
    };
  }

  async uploadMedia(
    propertyId: string,
    files: Express.Multer.File[],
    type: MediaType,
  ) {
    // Check if property exists
    const propertyExists = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true }
    });

    if (!propertyExists) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const uploadPromises = files.map(async (file) => {
      const { url, key } = await this.s3Service.uploadImage(file);
      return this.prisma.media.create({
        data: {
          url,
          key,
          type,
          propertyId,
        },
      });
    });

    return Promise.all(uploadPromises);
  }

  async deleteMedia(propertyId: string, mediaId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, propertyId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.s3Service.deleteImage(media.key);
    await this.prisma.media.delete({ where: { id: mediaId } });

    return { message: 'Media deleted successfully' };
  }

  async findAll(filterDto: PropertyFilterDto) {
    const { page = 1, limit = 10, search, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

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
          owner: {
            select: {
              id: true,
              phoneNumber: true,
              Owner: {
                select: {
                  companyName: true
                }
              },
              Developer: {
                select: {
                  companyName: true
                }
              }
            },
          },
          broker: {
            select: {
              id: true,
              phoneNumber: true,
            },
          },
          project: true,
          media: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Transform the response to flatten the owner structure
    const transformedProperties = properties.map(property => ({
      ...property,
      owner: {
        id: property.owner.id,
        phoneNumber: property.owner.phoneNumber,
        companyName: property.owner.Owner?.companyName || property.owner.Developer?.companyName
      }
    }));

    return {
      data: transformedProperties,
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
        owner: {
          select: {
            id: true,
            phoneNumber: true,
            Owner: {
              select: {
                companyName: true
              }
            },
            Developer: {
              select: {
                companyName: true
              }
            }
          },
        },
        broker: {
          select: {
            id: true,
            phoneNumber: true,
          },
        },
        project: true,
        media: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Transform the response to flatten the owner structure
    return {
      ...property,
      owner: {
        id: property.owner.id,
        phoneNumber: property.owner.phoneNumber,
        companyName: property.owner.Owner?.companyName || property.owner.Developer?.companyName
      }
    };
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
    const property = await this.findOne(id);

    // Delete all media from S3 and database
    const media = await this.prisma.media.findMany({
      where: { propertyId: id },
    });

    await Promise.all(
      media.map(async (item) => {
        await this.s3Service.deleteImage(item.key);
      }),
    );

    return this.prisma.property.delete({
      where: { id },
    });
  }
}
