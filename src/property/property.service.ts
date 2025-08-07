import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto, PropertyFilterDto, SimilarPropertiesQueryDto } from './dto/property.dto';
import { Prisma, MediaType } from '@prisma/client';
import { S3Service } from '../s3/s3.service';
import { calculateBoundingBox, calculateDistance, kmToDegrees } from '../utils/location.utils';
import { PropertySortField, SortOrder } from './dto/property.dto';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // Reusable method to map property to lightweight format
  private mapToLightweightProperty(property: any) {
    return {
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
      discountPercentage: property.discountPercentage,
      thumbnail: property.media[0]?.url,
      ownerName: property.owner.name,
      brokerLicenseNumber: property.owner.Broker?.licenseNumber,
      ownerRole: property.owner.role,
    };
  }

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
            Owner: true,
            Developer: true
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
      const { url, key } = await this.s3Service.uploadMedia(file);
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

    await this.s3Service.deleteMedia(media.key);
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

    if (filters.types && filters.types.length > 0) {
      where.type = { in: filters.types };
    }
    if (filters.categories && filters.categories.length > 0) {
      where.category = { in: filters.categories };
    }
    if (filters.unitStatuses && filters.unitStatuses.length > 0) {
      where.unitStatus = { in: filters.unitStatuses };
    }
    if (filters.cities && filters.cities.length > 0) {
      where.OR = [
        ...(where.OR || []),
        ...filters.cities.map(city => ({
          city: { 
            mode: 'insensitive' as const,
            equals: city 
          }
        }))
      ];
    }
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

    if (filters.projectId) {
      where.projectId = filters.projectId;
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
          discountPercentage: true,
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
              Developer: true,
              Owner: true,
              Broker: {
                select: {
                  licenseNumber: true,
                }
              }
            }
          },
        },
        orderBy: filters.sortBy === 'discountPercentage' 
          ? [
              { discountPercentage: { sort: filters.sortOrder || 'desc', nulls: 'last' } },
              { createdAt: 'desc' } // Secondary sort for consistent ordering
            ]
          : {
              [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
            },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Transform the response to a lightweight format
    const lightweightProperties = properties.map(property => this.mapToLightweightProperty(property));

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
            Owner: true,
            Developer: true,
            Broker: {
              select: {
                licenseNumber: true,
                description: true,
              }
            }
          },
        },
        broker: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
            Broker: {
              select: {
                licenseNumber: true,
                description: true,
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
        role: property.owner.role
      },
      broker: property.broker ? {
        id: property.broker.id,
        phoneNumber: property.broker.phoneNumber,
        name: property.broker.name,
        email: property.broker.email,
        profileImage: property.broker.profileImage,
        role: property.broker.role,
        licenseNumber: property.broker.Broker?.licenseNumber,
        description: property.broker.Broker?.description,
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
        await this.s3Service.deleteMedia(item.key);
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
                  Owner: true,
                  Developer: true
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

  async findSimilarProperties(
    propertyId: string,
    similarityParams?: SimilarPropertiesQueryDto
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMorePages: boolean;
    };
  }> {
    // Set default similarity parameters
    const params = {
      page: 1,
      limit: 10,
      typeWeight: 12,
      categoryWeight: 10,
      cityWeight: 8,
      locationWeight: 15,
      priceWeight: 10,
      spaceWeight: 8,
      closeDistance: 1,
      mediumDistance: 5,
      farDistance: 10,
      priceRangePercentage: 0.3,
      priceRangeMinMultiplier: 0.7,
      priceRangeMaxMultiplier: 1.3,
      spaceRangePercentage: 0.4,
      searchRadius: 5,
      minScore: 0,
      ...similarityParams
    };

    const pageNum = Number(params.page);
    const limitNum = Number(params.limit);
    const skip = (pageNum - 1) * limitNum;

    // First, get the reference property
    const referenceProperty = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
            role: true,
            Owner: true,
            Developer: true,
            Broker: {
              select: {
                licenseNumber: true
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
        media: true,
      }
    });

    if (!referenceProperty) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    // Calculate price and space ranges
    const referencePrice = Number(referenceProperty.price);
    const referenceSpace = Number(referenceProperty.space);
    
    const priceRange = referencePrice * params.priceRangePercentage;
    const minPriceRange = referencePrice - priceRange;
    const maxPriceRange = referencePrice + priceRange;

    const spaceRange = referenceSpace * params.spaceRangePercentage;
    const minSpaceRange = referenceSpace - spaceRange;
    const maxSpaceRange = referenceSpace + spaceRange;

    // Find similar properties based on multiple criteria
    const allSimilarProperties = await this.prisma.property.findMany({
      where: {
        id: { not: propertyId }, // Exclude the reference property
        OR: [
          // Same type and category
          {
            type: referenceProperty.type,
            category: referenceProperty.category,
          },
          // Same city
          {
            city: referenceProperty.city,
          },
          // Similar location (within searchRadius km)
          {
            locationLat: {
              gte: referenceProperty.locationLat - kmToDegrees(params.searchRadius),
              lte: referenceProperty.locationLat + kmToDegrees(params.searchRadius),
            },
            locationLng: {
              gte: referenceProperty.locationLng - kmToDegrees(params.searchRadius),
              lte: referenceProperty.locationLng + kmToDegrees(params.searchRadius),
            },
          },
          // Similar price range
          {
            price: {
              gte: minPriceRange,
              lte: maxPriceRange,
            },
          },
          // Similar space range
          {
            space: {
              gte: minSpaceRange,
              lte: maxSpaceRange,
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
            role: true,
            Owner: true,
            Developer: true,
            Broker: {
              select: {
                licenseNumber: true
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
        media: true,
      },
    });

    if (!allSimilarProperties.length) {
      return {
        data: [],
        meta: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
          hasMorePages: false
        }
      };
    }

    // Score and sort properties by similarity
    const scoredProperties = allSimilarProperties
      .map(property => {
        const propertyPrice = Number(property.price);
        const propertySpace = Number(property.space);
        
        let score = 0;
        
        // Type and category match
        if (property.type === referenceProperty.type) score += params.typeWeight;
        if (property.category === referenceProperty.category) score += params.categoryWeight;
        
        // City match
        if (property.city === referenceProperty.city) score += params.cityWeight;
        
        // Location proximity (calculate distance)
        const distance = calculateDistance(
          referenceProperty.locationLat,
          referenceProperty.locationLng,
          property.locationLat,
          property.locationLng
        );
        if (distance <= params.closeDistance) score += params.locationWeight;
        else if (distance <= params.mediumDistance) score += Math.floor(params.locationWeight * 0.7);
        else if (distance <= params.farDistance) score += Math.floor(params.locationWeight * 0.4);
        
        // Price similarity
        if (propertyPrice >= minPriceRange && propertyPrice <= maxPriceRange) {
          score += params.priceWeight;
        } else if (propertyPrice >= referencePrice * params.priceRangeMinMultiplier && 
                   propertyPrice <= referencePrice * params.priceRangeMaxMultiplier) {
          score += Math.floor(params.priceWeight * 0.5);
        }

        // Space similarity
        if (propertySpace >= minSpaceRange && propertySpace <= maxSpaceRange) {
          score += params.spaceWeight;
        }

        return {
          property,
          score
        };
      })
      .filter(item => item.score >= params.minScore) // Only include properties with minimum similarity score
      .sort((a, b) => b.score - a.score); // Sort by score descending

    // Apply pagination
    const total = scoredProperties.length;
    const paginatedProperties = scoredProperties.slice(skip, skip + limitNum);

    // Transform properties to lightweight format (same as findAll)
    const data = paginatedProperties.map(item => this.mapToLightweightProperty(item.property));

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMorePages: pageNum < Math.ceil(total / limitNum),
      }
    };
  }
}
