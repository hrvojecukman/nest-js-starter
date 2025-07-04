import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto, PropertyFilterDto } from './dto/property.dto';
import { Prisma, MediaType } from '@prisma/client';
import { S3Service } from '../s3/s3.service';
import { calculateBoundingBox } from '../utils/location.utils';
import { PropertySortField, SortOrder } from './dto/property.dto';

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

    if (user.role !== 'OWNER' && user.role !== 'DEVELOPER' && user.role !== 'BROKER') {
      throw new BadRequestException('Only owners, developers and brokers can create properties');
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
            name: true,
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
      price: Number(property.price),
      media: property.media.map(media => ({
        url: media.url,
        type: media.type
      })),
      owner: {
        id: property.owner.id,
        phoneNumber: property.owner.phoneNumber,
        name: property.owner.name,
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
    const { 
      page = 1, 
      limit = 10, 
      search, 
      brokerId,
      developerId,
      ...filters 
    } = filterDto;
    
    // Convert string values to numbers for pagination
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.PropertyWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;
    if (filters.unitStatus) where.unitStatus = filters.unitStatus;
    if (filters.ownerRole) where.owner = { role: filters.ownerRole };
    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice ? { gte: Number(filters.minPrice) } : {}),
        ...(filters.maxPrice ? { lte: Number(filters.maxPrice) } : {}),
      };
    }
    if (filters.minSpace || filters.maxSpace) {
      where.space = {
        ...(filters.minSpace ? { gte: Number(filters.minSpace) } : {}),
        ...(filters.maxSpace ? { lte: Number(filters.maxSpace) } : {}),
      };
    }

    if (brokerId) {
      where.brokerId = brokerId;
    }

    if (developerId) {
      where.project = {
        developerId: developerId
      };
    }

    // Add location filtering using bounding box
    if (filters.lat !== undefined && filters.lng !== undefined && filters.radius !== undefined) {
      const lat = Number(filters.lat);
      const lng = Number(filters.lng);
      const radius = Number(filters.radius);
      const { minLat, maxLat, minLng, maxLng } = calculateBoundingBox(lat, lng, radius);
      where.AND = [
        { locationLat: { gte: minLat, lte: maxLat } },
        { locationLng: { gte: minLng, lte: maxLng } },
      ];
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          city: true,
          space: true,
          type: true,
          category: true,
          unitStatus: true,
          locationLat: true,
          locationLng: true,
          numberOfLivingRooms: true,
          numberOfRooms: true,
          numberOfKitchen: true,
          numberOfWC: true,
          numberOfFloors: true,
          streetWidth: true,
          media: {
            select: {
              url: true,
              type: true
            },
            take: 1
          },
          owner: {
            select: {
              role: true,
              Developer: {
                select: {
                  companyName: true
                }
              },
              Owner: {
                select: {
                  companyName: true
                }
              },
              Broker: {
                select: {
                  licenseNumber: true,
                }
              }
            }
          },
        },
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Transform the response to a lightweight format
    const lightweightProperties = properties.map(property => ({
      id: property.id,
      title: property.title,
      price: Number(property.price),
      currency: property.currency,
      city: property.city,
      space: property.space,
      type: property.type,
      category: property.category,
      unitStatus: property.unitStatus,
      location: {
        lat: property.locationLat,
        lng: property.locationLng
      },
      numberOfLivingRooms: property.numberOfLivingRooms,
      numberOfRooms: property.numberOfRooms,
      numberOfKitchen: property.numberOfKitchen,
      numberOfWC: property.numberOfWC,
      numberOfFloors: property.numberOfFloors,
      streetWidth: property.streetWidth,
      thumbnail: property.media[0]?.url,
      companyName: property.owner.Developer?.companyName || property.owner.Owner?.companyName,
      brokerLicenseNumber: property.owner.Broker?.licenseNumber,
      ownerRole: property.owner.role,
    }));

    return {
      data: lightweightProperties,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMorePages: pageNum < Math.ceil(total / limitNum),
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
            name: true,
            role: true,
            Owner: {
              select: {
                companyName: true
              }
            },
            Developer: {
              select: {
                companyName: true
              }
            },
            Broker: {
              select: {
                licenseNumber: true,
              }
            }
          },
        },
        broker: {
          select: {
            id: true,
            phoneNumber: true,
            role: true,
            Broker: {
              select: {
                licenseNumber: true,
                isLicensed: true,
              }
            }
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
      price: Number(property.price),
      media: property.media.map(media => ({
        url: media.url,
        type: media.type
      })),
      owner: {
        id: property.owner.id,
        phoneNumber: property.owner.phoneNumber,
        name: property.owner.name,
        companyName: property.owner.Owner?.companyName || property.owner.Developer?.companyName,
        role: property.owner.role
      },
      broker: property.broker ? {
        id: property.broker.id,
        phoneNumber: property.broker.phoneNumber,
        role: property.broker.role,
        licenseNumber: property.broker.Broker?.licenseNumber,
        isLicensed: property.broker.Broker?.isLicensed
      } : null
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

  async createMany(createPropertyDtos: CreatePropertyDto[], ownerId: string) {
    // Check if user exists and has appropriate role
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'OWNER' && user.role !== 'DEVELOPER' && user.role !== 'BROKER') {
      throw new BadRequestException('Only owners, developers and brokers can create properties');
    }

    // Use transaction to ensure all properties are created or none
    return this.prisma.$transaction(async (prisma) => {
      const properties = await Promise.all(
        createPropertyDtos.map(async (dto) => {
          const { brokerId, projectId, ...propertyData } = dto;
          
          const property = await prisma.property.create({
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
                  name: true,
                  role: true,
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
                  Broker: {
                    select: {
                      licenseNumber: true
                    }
                  }
                },
              },
              project: true,
              media: true,
            },
          });

          return {
            ...property,
            price: Number(property.price),
            media: property.media.map(media => ({
              url: media.url,
              type: media.type
            })),
            owner: {
              id: property.owner.id,
              phoneNumber: property.owner.phoneNumber,
              name: property.owner.name,
              companyName: property.owner.Owner?.companyName || property.owner.Developer?.companyName,
              role: property.owner.role
            },
            broker: property.broker ? {
              licenseNumber: property.broker.Broker?.licenseNumber,
            } : null
          };
        })
      );

      return properties;
    });
  }
}
