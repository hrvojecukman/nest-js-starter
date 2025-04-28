import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, ProjectSummaryDto, ProjectDetailDto } from './dto/project.dto';
import { Role, Prisma, Project, Property, MediaType } from '@prisma/client';
import { PropertyDto } from 'src/property/dto/property.dto';
import { S3Service } from '../s3/s3.service';
import { ProjectFilterDto } from './dto/project.dto';
import { ProjectSortField, SortOrder } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  private mapPropertyToDto(property: Property & { 
    owner: { 
      id: string; 
      phoneNumber: string; 
      Owner: { companyName: string | null } | null; 
      Developer: { companyName: string | null } | null; 
    }; 
    broker: { id: string; phoneNumber: string; } | null;
    media: { url: string; type: string }[];
  }): PropertyDto {
    return {
      ...property,
      price: Number(property.price),
      cashBackPercentage: property.cashBackPercentage ?? undefined,
      owner: {
        id: property.owner.id,
        phoneNumber: property.owner.phoneNumber,
        companyName: property.owner.Owner?.companyName || property.owner.Developer?.companyName || undefined
      },
      broker: property.broker ? {
        id: property.broker.id,
        phoneNumber: property.broker.phoneNumber
      } : undefined,
      media: property.media
    };
  }

  private calculatePropertyStats(properties: { id: string; price: any; unitStatus: string }[]) {
    const total = properties.length;
    const available = properties.filter(p => p.unitStatus === 'available').length;
    const average = properties.reduce((sum, p) => sum + Number(p.price), 0) / total;
    const percentSold = total > 0 ? ((total - available) / total) * 100 : 0;

    return { total, available, average, percentSold };
  }

  private mapProjectToSummaryDto(project: Project & {
    _count: { properties: number };
    properties: { id: string; price: any; unitStatus: string }[];
    developer: { Developer: { companyName: string | null } | null };
    media: { url: string; type: MediaType }[];
  }, avgPrice: number | null): ProjectSummaryDto {
    const { total, available, percentSold } = this.calculatePropertyStats(project.properties);

    return {
      id: project.id,
      name: project.name,
      city: project.city,
      type: project.type,
      category: project.category,
      media: project.media,
      numberOfUnits: total,
      numberOfAvailableUnits: available,
      averageUnitPrice: Number(avgPrice ?? 0),
      percentSold,
      developerName: project.developer.Developer?.companyName ?? 'N/A'
    };
  }

  private mapProjectToDetailDto(project: Project & {
    properties: (Property & {
      owner: { 
        id: string; 
        phoneNumber: string; 
        Owner: { companyName: string | null } | null; 
        Developer: { companyName: string | null } | null; 
      };
      broker: { id: string; phoneNumber: string; } | null;
      media: { url: string; type: string }[];
    })[];
    developer: { Developer: { companyName: string | null } | null };
    nearbyPlaces: { name: string; distance: number }[];
    media: { url: string; type: MediaType }[];
  }): ProjectDetailDto {
    const { total, available, average, percentSold } = this.calculatePropertyStats(project.properties);

    return {
      id: project.id,
      name: project.name,
      city: project.city,
      type: project.type,
      category: project.category,
      media: project.media,
      description: project.description ?? '',
      numberOfUnits: total,
      numberOfAvailableUnits: available,
      averageUnitPrice: average,
      percentSold,
      developerName: project.developer.Developer?.companyName ?? 'N/A',
      infrastructureItems: project.infrastructureItems,
      nearbyPlaces: project.nearbyPlaces.map(place => ({
        name: place.name,
        distance: place.distance
      })),
      properties: project.properties.map(p => this.mapPropertyToDto(p))
    };
  }

  async create(dto: CreateProjectDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.DEVELOPER) {
      throw new ForbiddenException('Only developers can create projects');
    }

    const { nearbyPlaces, ...projectData } = dto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        developer: {
          connect: { id: userId }
        },
        nearbyPlaces: {
          create: nearbyPlaces.map(place => ({
            name: place.name,
            distance: place.distance
          }))
        }
      },
      include: {
        developer: {
          select: {
            Developer: {
              select: {
                companyName: true
              }
            }
          }
        },
        nearbyPlaces: true,
        media: true
      }
    });
  }

  async uploadMedia(
    projectId: string,
    files: Express.Multer.File[],
    type: MediaType,
  ) {
    const projectExists = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!projectExists) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map(async (file) => {
      const { url, key } = await this.s3Service.uploadImage(file, 'projects');
      return this.prisma.media.create({
        data: {
          url,
          key,
          type,
          projectId,
        },
      });
    });

    return Promise.all(uploadPromises);
  }

  async deleteMedia(projectId: string, mediaId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, projectId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.s3Service.deleteImage(media.key);
    await this.prisma.media.delete({ where: { id: mediaId } });

    return { message: 'Media deleted successfully' };
  }

  async findAll(filterDto: ProjectFilterDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = ProjectSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      ...filters 
    } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;
    if (filters.city) where.city = filters.city;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          developer: {
            select: {
              Developer: {
                select: {
                  companyName: true
                }
              }
            }
          },
          _count: { select: { properties: true } },
          properties: {
            select: { 
              id: true,
              price: true,
              unitStatus: true
            }
          },
          nearbyPlaces: true,
          media: true
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.project.count({ where })
    ]);

    const projectsWithStats = await Promise.all(projects.map(async (p) => {
      const avg = await this.prisma.property.aggregate({
        where: { projectId: p.id },
        _avg: { price: true },
      });

      return this.mapProjectToSummaryDto(p, avg._avg.price ? Number(avg._avg.price) : null);
    }));

    return {
      data: projectsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string): Promise<ProjectDetailDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        developer: {
          select: {
            Developer: {
              select: {
                companyName: true
              }
            }
          }
        },
        properties: {
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
              }
            },
            broker: {
              select: {
                id: true,
                phoneNumber: true
              }
            },
            media: true
          }
        },
        nearbyPlaces: true,
        media: true
      }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return this.mapProjectToDetailDto(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { developer: { select: { id: true } } }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (project.developer.id !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    const { nearbyPlaces, ...projectData } = dto;

    return this.prisma.project.update({
      where: { id },
      data: {
        ...projectData,
        ...(nearbyPlaces && {
          nearbyPlaces: {
            deleteMany: {},
            create: nearbyPlaces.map(place => ({
              name: place.name,
              distance: place.distance
            }))
          }
        })
      },
      include: {
        developer: {
          select: {
            Developer: {
              select: {
                companyName: true
              }
            }
          }
        },
        nearbyPlaces: true,
        media: true
      }
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { developer: { select: { id: true } } }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (project.developer.id !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    return this.prisma.project.delete({
      where: { id }
    });
  }

  async addProperties(projectId: string, propertyIds: string[], userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { developer: { select: { id: true } } }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.developer.id !== userId) {
      throw new ForbiddenException('You can only add properties to your own projects');
    }

    // Verify all properties exist and belong to the user
    const properties = await this.prisma.property.findMany({
      where: {
        id: { in: propertyIds },
        ownerId: userId
      },
      select: { id: true }
    });

    if (properties.length !== propertyIds.length) {
      throw new NotFoundException('One or more properties not found or not owned by you');
    }

    // Update all properties to be part of the project
    await this.prisma.property.updateMany({
      where: {
        id: { in: propertyIds }
      },
      data: {
        projectId
      }
    });

    return this.findOne(projectId);
  }
} 