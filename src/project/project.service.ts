import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, ProjectSummaryDto, ProjectDetailDto, SimilarProjectsQueryDto } from './dto/project.dto';
import { Role, Prisma, Project, Property, MediaType, ProjectTimeline } from '@prisma/client';
import { PropertyDto } from 'src/property/dto/property.dto';
import { S3Service } from '../s3/s3.service';
import { ProjectFilterDto } from './dto/project.dto';
import { ProjectSortField, SortOrder } from './dto/project.dto';
import { calculateBoundingBox, calculateDistance, kmToDegrees } from '../utils/location.utils';

// Type definitions for cleaner code


type PropertyWithRelations = Property & {
  owner: {
    id: string;
    phoneNumber: string;
    name: string;
    role: string;
    Owner: {} | null;
    Developer: {} | null;
  };
  broker: { id: string; phoneNumber: string } | null;
  media: { url: string; type: string }[];
};

type ProjectWithRelations = Project & {
  properties: PropertyWithRelations[];
  developer: any; // Will be automatically typed by Prisma
  nearbyPlaces: { name: string; distance: number }[];
  media: { url: string; type: MediaType; name?: string | null }[];
  timeline: ProjectTimeline[];
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
  private mapDeveloperInfo = (developer: any) => ({
    id: developer.id,
    name: developer.name ?? undefined,
    profileImage: developer.profileImage ?? undefined,
    isLicensed: developer.Developer?.isLicensed ?? undefined,
    hasWafi: developer.Developer?.hasWafi ?? undefined,
    acceptsBanks: developer.Developer?.acceptsBanks ?? undefined,
    description: developer.Developer?.description ?? undefined,
    location: developer.Developer?.location ?? undefined,
    phoneNumber: developer.phoneNumber ?? undefined,
    email: developer.email ?? undefined,
  });

  private mapDeveloperSimple = (developer: any) => ({
    name: developer.name ?? undefined,
    profileImage: developer.profileImage ?? undefined,
  });

  private mapMedia = (media: { url: string; type: string | MediaType; name?: string | null }[]) =>
    media.map(m => ({ url: m.url, type: m.type as MediaType, name: m.name ?? undefined }));

  private mapPropertyToDto = (property: PropertyWithRelations): PropertyDto => ({
    ...property,
    price: Number(property.price),
    cashBackPercentage: property.cashBackPercentage ?? undefined,
    owner: {
      id: property.owner.id,
      name: property.owner.name,
      phoneNumber: property.owner.phoneNumber,
      role: property.owner.role
    },
    broker: property.broker ? {
      id: property.broker.id,
      phoneNumber: property.broker.phoneNumber
    } : undefined,
    media: property.media
  });

  private mapProjectToSummary = (project: Project & {
    developer: any;
    media: { url: string; type: MediaType }[];
  }, stats: ProjectStats) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    city: project.city,
    type: project.type,
    category: project.category,
    locationLat: project.locationLat,
    locationLng: project.locationLng,
    media: this.mapMedia(project.media),
    numberOfUnits: stats.total,
    numberOfAvailableUnits: stats.available,
    amountSold: Number(stats.amountSold),
    averageUnitPrice: Number(stats.averagePrice),
    percentSold: stats.percentSold,
    averageUnitSize: stats.averageSize,
    developer: this.mapDeveloperSimple(project.developer)
  });


  async create(dto: CreateProjectDto, userId: string) {
    await this.checkDeveloperRole(userId);
    const { nearbyPlaces, timeline, ...projectData } = dto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        developer: { connect: { id: userId } },
        nearbyPlaces: {
          create: nearbyPlaces.map(place => ({
            name: place.name,
            distance: place.distance
          }))
        },
        ...(timeline && {
          timeline: {
            create: timeline.map(item => ({
              type: item.type as any,
              title: item.title,
              description: item.description,
              startDate: new Date(item.startDate),
              endDate: item.endDate ? new Date(item.endDate) : null,
              isInProgress: item.isInProgress ?? false,
              isCompleted: item.isCompleted ?? false,
              progress: item.progress,
              notes: item.notes
            }))
          }
        })
      },
              include: {
          developer: {
            include: {
              Developer: true
            }
          },
          nearbyPlaces: true,
          media: true,
          timeline: true
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

    // If uploading documents, only allow PDFs
    if (type === 'document') {
      const nonPdf = files.find(file => file.mimetype !== 'application/pdf');
      if (nonPdf) {
        throw new BadRequestException('Only PDF files are allowed for document uploads');
      }
    }

    const uploadPromises = files.map(async (file) => {
      const { url, key } = await this.s3Service.uploadMedia(file, 'projects');
      return this.prisma.media.create({
        data: { 
          url, 
          key, 
          type, 
          projectId,
          name: file.originalname 
        }
      });
    });

    return Promise.all(uploadPromises);
  }

  async deleteMedia(projectId: string, mediaId: string) {
    const media = await this.prisma.media.findFirstOrThrow({
      where: { id: mediaId, projectId }
    });

    await Promise.all([
      this.s3Service.deleteMedia(media.key),
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
      lat,
      lng,
      radius,
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

    // Add location filtering using bounding box
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const radiusNum = Number(radius);
      const { minLat, maxLat, minLng, maxLng } = calculateBoundingBox(latNum, lngNum, radiusNum);
      where.AND = [
        { locationLat: { gte: minLat, lte: maxLat } },
        { locationLng: { gte: minLng, lte: maxLng } },
      ];
    }

    const [projects, total] = await Promise.all([
      this.getProjectsWithIncludes(where, {
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder }
      }),
      this.prisma.project.count({ where })
    ]);

    if (!projects.length) {
      return this.createPaginatedResponse([], total, pageNum, limitNum);
    }

    // Get stats for all projects
    const projectIds = projects.map(p => p.id);
    const statsMap = await this.getProjectsStats(projectIds);

    // Map projects to summary DTOs
    const data = this.mapProjectsToSummaryWithStats(projects, statsMap);
    
    return this.createPaginatedResponse(data, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<ProjectDetailDto> {
    try {
      const [project, stats] = await Promise.all([
        this.prisma.project.findUniqueOrThrow({
          where: { id },
          include: {
            developer: {
              select: {
                id: true,
                email: true,
                phoneNumber: true,
                name: true,
                profileImage: true,
                Developer: true
              }
            },
            nearbyPlaces: true,
            media: true,
            timeline: true
          }
        }),
        this.getProjectStats(id)
      ]);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        city: project.city,
        type: project.type,
        category: project.category,
        locationLat: project.locationLat,
        locationLng: project.locationLng,
        media: this.mapMedia(project.media),
        numberOfUnits: stats.total,
        numberOfAvailableUnits: stats.available,
        averageUnitPrice: stats.averagePrice,
        percentSold: stats.percentSold,
        developer: this.mapDeveloperInfo(project.developer),
        amountSold: stats.amountSold,
        averageUnitSize: stats.averageSize,
        infrastructureItems: project.infrastructureItems,
        nearbyPlaces: this.mapNearbyPlaces(project.nearbyPlaces),
        timeline: this.mapTimeline(project.timeline)
      };
    } catch (error) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }

  // Helper method to get project stats
  private async getProjectStats(projectId: string) {
    const [allStats, soldStats] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['projectId'],
        where: { projectId },
        _count: { id: true },
        _avg: { price: true, space: true }
      }),
      this.prisma.property.groupBy({
        by: ['projectId'],
        where: { 
          projectId,
          unitStatus: { not: 'available' }
        },
        _count: { id: true },
        _sum: { price: true }
      })
    ]);

    const stats = allStats[0] || { _count: { id: 0 }, _avg: { price: 0, space: 0 } };
    const sold = soldStats[0] || { _count: { id: 0 }, _sum: { price: 0 } };
    const total = stats._count.id;
    const soldCount = sold._count.id;

    return {
      total,
      available: total - soldCount,
      averagePrice: Number(stats._avg.price) || 0,
      averageSize: Number(stats._avg.space) || 0,
      percentSold: total > 0 ? Math.round((soldCount / total) * 100) : 0,
      amountSold: Number(sold._sum.price) || 0
    };
  }

  // Helper method to map nearby places
  private mapNearbyPlaces(places: any[]) {
    return places.map(place => ({
      name: place.name,
      distance: place.distance
    }));
  }

  // Helper method to map timeline
  private mapTimeline(timeline: any[]) {
    return timeline?.map(t => ({
      id: t.id,
      type: t.type,
      title: t.title,
      description: t.description ?? undefined,
      startDate: t.startDate,
      endDate: t.endDate ?? undefined,
      isInProgress: t.isInProgress,
      isCompleted: t.isCompleted,
      progress: t.progress ?? undefined,
      notes: t.notes ?? undefined,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    })) || [];
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.checkProjectAccess(id, userId);
    const { nearbyPlaces, timeline, ...projectData } = dto;

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
            Developer: true
          }
        },
        nearbyPlaces: true,
        media: true,
        timeline: true
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

  async getProjectDocuments(projectId: string) {
    // Ensure project exists
    try {
      await this.prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { id: true } });
    } catch (error) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    // Fetch only document media
    return this.prisma.media.findMany({
      where: { projectId, type: 'document' },
      select: { id: true, url: true, type: true, key: true, name: true, createdAt: true }
    });
  }

  async findSimilarProjects(
    projectId: string, 
    limit: number = 10, 
    page: number = 1,
    similarityParams?: SimilarProjectsQueryDto
  ): Promise<{
    data: ProjectSummaryDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMorePages: boolean;
    };
  }> {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    // Set default similarity parameters
    const params = {
      typeWeight: 10,
      categoryWeight: 10,
      cityWeight: 8,
      locationWeight: 7,
      priceWeight: 6,
      closeDistance: 1,
      mediumDistance: 5,
      farDistance: 10,
      priceRangePercentage: 0.3,
      priceRangeMinMultiplier: 0.7,
      priceRangeMaxMultiplier: 1.3,
      searchRadius: 5,
      minScore: 0,
      ...similarityParams
    };
    // First, get the reference project
    const referenceProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        developer: {
          include: {
            Developer: true
          }
        },
        media: true
      }
    });

    if (!referenceProject) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Get project stats for price range calculation
    const projectStats = await this.prisma.property.groupBy({
      by: ['projectId'],
      where: { projectId },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    });

    const avgPrice = projectStats[0]?._avg.price ? Number(projectStats[0]._avg.price) : 0;
    const minPrice = projectStats[0]?._min.price ? Number(projectStats[0]._min.price) : 0;
    const maxPrice = projectStats[0]?._max.price ? Number(projectStats[0]._max.price) : 0;

    // Calculate price range using customizable parameters
    const priceRange = avgPrice * params.priceRangePercentage;
    const minPriceRange = avgPrice - priceRange;
    const maxPriceRange = avgPrice + priceRange;

    // Find similar projects based on multiple criteria (get all for scoring)
    const allSimilarProjects = await this.prisma.project.findMany({
      where: {
        id: { not: projectId }, // Exclude the reference project
        OR: [
          // Same type and category
          {
            type: referenceProject.type,
            category: referenceProject.category,
          },
          // Same city
          {
            city: referenceProject.city,
          },
          // Similar location (within searchRadius km)
          {
            locationLat: {
              gte: referenceProject.locationLat - kmToDegrees(params.searchRadius), // Convert km to degrees
              lte: referenceProject.locationLat + kmToDegrees(params.searchRadius),
            },
            locationLng: {
              gte: referenceProject.locationLng - kmToDegrees(params.searchRadius),
              lte: referenceProject.locationLng + kmToDegrees(params.searchRadius),
            },
          },
        ],
      },
      include: {
        developer: {
          include: {
            Developer: true
          }
        },
        media: true
      },
    });

    if (!allSimilarProjects.length) {
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

    // Get stats for all similar projects
    const projectIds = allSimilarProjects.map(p => p.id);
    const statsMap = await this.getProjectsStats(projectIds);

    // Score and sort projects by similarity
    const scoredProjects = allSimilarProjects
      .map(project => {
        const stats = statsMap.get(project.id) || { 
          total: 0, 
          averagePrice: 0, 
          averageSize: 0, 
          soldCount: 0, 
          amountSold: 0 
        };
        
        let score = 0;
        
        // Type and category match
        if (project.type === referenceProject.type) score += params.typeWeight;
        if (project.category === referenceProject.category) score += params.categoryWeight;
        
        // City match
        if (project.city === referenceProject.city) score += params.cityWeight;
        
        // Location proximity (calculate distance)
        const distance = calculateDistance(
          referenceProject.locationLat,
          referenceProject.locationLng,
          project.locationLat,
          project.locationLng
        );
        if (distance <= params.closeDistance) score += params.locationWeight;
        else if (distance <= params.mediumDistance) score += Math.floor(params.locationWeight * 0.7);
        else if (distance <= params.farDistance) score += Math.floor(params.locationWeight * 0.4);
        
        // Price similarity
        const projectAvgPrice = stats.averagePrice;
        if (projectAvgPrice >= minPriceRange && projectAvgPrice <= maxPriceRange) {
          score += params.priceWeight;
        } else if (projectAvgPrice >= minPrice * params.priceRangeMinMultiplier && 
                   projectAvgPrice <= maxPrice * params.priceRangeMaxMultiplier) {
          score += Math.floor(params.priceWeight * 0.5);
        }

        return {
          project,
          stats,
          score
        };
      })
      .filter(item => item.score >= params.minScore) // Only include projects with minimum similarity score
      .sort((a, b) => b.score - a.score); // Sort by score descending

    // Apply pagination
    const total = scoredProjects.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedProjects = scoredProjects.slice(skip, skip + limitNum);

    // Map projects to summary DTOs
    const data = this.mapProjectsToSummaryWithStats(
      paginatedProjects.map(item => item.project),
      statsMap
    );

    return this.createPaginatedResponse(data, total, pageNum, limitNum);
  }

  // Reusable method to get project stats for multiple projects
  private async getProjectsStats(projectIds: string[]) {
    if (!projectIds.length) {
      return new Map();
    }

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

    return statsMap;
  }

  // Reusable method to create paginated response
  private createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMorePages: page < totalPages
      }
    };
  }

  // Reusable method to get projects with basic includes
  private async getProjectsWithIncludes(where: Prisma.ProjectWhereInput, options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }) {
    return this.prisma.project.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
      include: {
        developer: {
          include: {
            Developer: true
          }
        },
        media: true
      }
    });
  }

  // Reusable method to map projects to summary DTOs with stats
  private mapProjectsToSummaryWithStats(
    projects: any[],
    statsMap: Map<string, any>
  ): ProjectSummaryDto[] {
    return projects.map(project => {
      const stats = statsMap.get(project.id) || { 
        total: 0, 
        averagePrice: 0, 
        averageSize: 0, 
        soldCount: 0, 
        amountSold: 0 
      };
      
      return this.mapProjectToSummary(project, {
        total: stats.total,
        available: stats.total - stats.soldCount,
        averagePrice: Number(stats.averagePrice),
        averageSize: Number(stats.averageSize),
        percentSold: stats.total > 0 ? Math.round((stats.soldCount / stats.total) * 100) : 0,
        amountSold: Number(stats.amountSold)
      });
    });
  }
} 