import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, ProjectSummaryDto, ProjectDetailDto } from './dto/project.dto';
import { Role, Prisma, Project, Property, MediaType } from '@prisma/client';
import { PropertyDto } from 'src/property/dto/property.dto';
import { S3Service } from '../s3/s3.service';
import { ProjectFilterDto } from './dto/project.dto';
import { ProjectSortField, SortOrder } from './dto/project.dto';

// Type definitions for cleaner code
type DeveloperWithCompany = {
  name: string | null;
  profileImage: string | null;
  Developer: { companyName: string | null } | null;
};

type PropertyWithRelations = Property & {
  owner: {
    id: string;
    phoneNumber: string;
    Owner: { companyName: string | null } | null;
    Developer: { companyName: string | null } | null;
  };
  broker: { id: string; phoneNumber: string } | null;
  media: { url: string; type: string }[];
};

type ProjectWithRelations = Project & {
  properties: PropertyWithRelations[];
  developer: DeveloperWithCompany;
  nearbyPlaces: { name: string; distance: number }[];
  media: { url: string; type: MediaType }[];
};

type ProjectStats = {
  total: number;
  available: number;
  averagePrice: number;
  percentSold: number;
  amountSold: number;
  averageSize: number;
};

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // Common authorization check
  private async checkProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { developer: { select: { id: true } } }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.developer.id !== userId) {
      throw new ForbiddenException('You can only modify your own projects');
    }

    return project;
  }

  // Common developer role check
  private async checkDeveloperRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.DEVELOPER) {
      throw new ForbiddenException('Only developers can perform this action');
    }
  }

  // Simplified mapping functions
  private mapDeveloperInfo = (developer: DeveloperWithCompany) => ({
    name: developer.name ?? undefined,
    profileImage: developer.profileImage ?? undefined,
    companyName: developer.Developer?.companyName ?? undefined
  });

  private mapMedia = (media: { url: string; type: string | MediaType }[]) =>
    media.map(m => ({ url: m.url, type: m.type as MediaType }));

  private mapPropertyToDto = (property: PropertyWithRelations): PropertyDto => ({
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
  });

  private calculateStats = (properties: PropertyWithRelations[]): ProjectStats => {
    const total = properties.length;
    const available = properties.filter(p => p.unitStatus === 'available').length;
    const sold = total - available;
    const totalPrice = properties.reduce((sum, p) => sum + Number(p.price), 0);
    const totalSize = properties.reduce((sum, p) => sum + Number(p.space), 0);
    
    return {
      total,
      available,
      averagePrice: total > 0 ? totalPrice / total : 0,
      averageSize: total > 0 ? totalSize / total : 0,
      percentSold: total > 0 ? Math.round((sold / total) * 100) : 0,
      amountSold: properties
        .filter(p => p.unitStatus !== 'available')
        .reduce((sum, p) => sum + Number(p.price), 0)
    };
  };

  private mapProjectToSummary = (project: Project & {
    developer: DeveloperWithCompany;
    media: { url: string; type: MediaType }[];
  }, stats: ProjectStats) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    city: project.city,
    type: project.type,
    category: project.category,
    media: this.mapMedia(project.media),
    numberOfUnits: stats.total,
    numberOfAvailableUnits: stats.available,
    amountSold: Number(stats.amountSold),
    averageUnitPrice: Number(stats.averagePrice),
    percentSold: stats.percentSold,
    averageUnitSize: stats.averageSize,
    developer: this.mapDeveloperInfo(project.developer)
  });

  private mapProjectToDetailDto = (project: ProjectWithRelations): ProjectDetailDto => {
    const stats = this.calculateStats(project.properties);
    const base = this.mapProjectToSummary(project, stats);
    
    return {
      ...base,
      infrastructureItems: project.infrastructureItems,
      nearbyPlaces: project.nearbyPlaces.map(place => ({
        name: place.name,
        distance: place.distance
      })),
      properties: project.properties.map(this.mapPropertyToDto)
    };
  };

  // Common include patterns
  private readonly developerInclude = {
    developer: {
      select: {
        id: true,
        name: true,
        profileImage: true,
        Developer: { select: { companyName: true } }
      }
    }
  };

  private readonly developerSimpleInclude = {
    developer: {
      select: {
        Developer: { select: { companyName: true } }
      }
    }
  };

  async create(dto: CreateProjectDto, userId: string) {
    await this.checkDeveloperRole(userId);
    const { nearbyPlaces, ...projectData } = dto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        developer: { connect: { id: userId } },
        nearbyPlaces: {
          create: nearbyPlaces.map(place => ({
            name: place.name,
            distance: place.distance
          }))
        }
      },
      include: {
        ...this.developerSimpleInclude,
        nearbyPlaces: true,
        media: true
      }
    });
  }

  async uploadMedia(projectId: string, files: Express.Multer.File[], type: MediaType) {
    await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { id: true }
    });

    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map(async (file) => {
      const { url, key } = await this.s3Service.uploadImage(file, 'projects');
      return this.prisma.media.create({
        data: { url, key, type, projectId }
      });
    });

    return Promise.all(uploadPromises);
  }

  async deleteMedia(projectId: string, mediaId: string) {
    const media = await this.prisma.media.findFirstOrThrow({
      where: { id: mediaId, projectId }
    });

    await Promise.all([
      this.s3Service.deleteImage(media.key),
      this.prisma.media.delete({ where: { id: mediaId } })
    ]);

    return { message: 'Media deleted successfully' };
  }

  async findAll(filterDto: ProjectFilterDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      developerId,
      sortBy = ProjectSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      ...filters 
    } = filterDto;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.ProjectWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      ...(filters.city && { city: filters.city }),
      ...(developerId && { developerId })
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          ...this.developerInclude,
          media: true
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      this.prisma.project.count({ where })
    ]);

    if (!projects.length) {
      return {
        data: [],
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasMorePages: pageNum < Math.ceil(total / limitNum)
        }
      };
    }

    // Single optimized query for all stats
    const projectIds = projects.map(p => p.id);
    const [allStats, soldStats] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds } },
        _count: { id: true },
        _avg: { price: true, space: true },
        _sum: { price: true }
      }),
      this.prisma.property.groupBy({
        by: ['projectId'],
        where: { 
          projectId: { in: projectIds },
          unitStatus: { not: 'available' }
        },
        _count: { id: true },
        _sum: { price: true }
      })
    ]);

    // Create stats map
    const statsMap = new Map(
      allStats.map(stat => [
        stat.projectId,
        {
          total: stat._count.id,
          averagePrice: Number(stat._avg.price) || 0,
          averageSize: Number(stat._avg.space) || 0,
          soldCount: 0,
          amountSold: 0
        }
      ])
    );

    soldStats.forEach(stat => {
      const existing = statsMap.get(stat.projectId);
      if (existing) {
        existing.soldCount = stat._count.id;
        existing.amountSold = Number(stat._sum.price) || 0;
      }
    });

    const totalPages = Math.ceil(total / limitNum);
    return {
      data: projects.map(project => {
        const stats = statsMap.get(project.id) || { total: 0, averagePrice: 0, averageSize: 0, soldCount: 0, amountSold: 0 };
                 return this.mapProjectToSummary(project, {
           total: stats.total,
           available: stats.total - stats.soldCount,
           averagePrice: Number(stats.averagePrice),
           averageSize: Number(stats.averageSize),
           percentSold: stats.total > 0 ? Math.round((stats.soldCount / stats.total) * 100) : 0,
           amountSold: Number(stats.amountSold)
         });
      }),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMorePages: pageNum < totalPages
      }
    };
  }

  async findOne(id: string): Promise<ProjectDetailDto> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        ...this.developerInclude,
        properties: {
          include: {
            owner: {
              select: {
                id: true,
                phoneNumber: true,
                Owner: { select: { companyName: true } },
                Developer: { select: { companyName: true } }
              }
            },
            broker: {
              select: { id: true, phoneNumber: true }
            },
            media: true
          }
        },
        nearbyPlaces: true,
        media: true
      }
    });

    return this.mapProjectToDetailDto(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.checkProjectAccess(id, userId);
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
        ...this.developerSimpleInclude,
        nearbyPlaces: true,
        media: true
      }
    });
  }

  async remove(id: string, userId: string) {
    await this.checkProjectAccess(id, userId);
    return this.prisma.project.delete({ where: { id } });
  }

  async addProperties(projectId: string, propertyIds: string[], userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds }, ownerId: userId },
      select: { id: true }
    });

    if (properties.length !== propertyIds.length) {
      throw new NotFoundException('One or more properties not found or not owned by you');
    }

    await this.prisma.property.updateMany({
      where: { id: { in: propertyIds } },
      data: { projectId }
    });

    return this.findOne(projectId);
  }
} 