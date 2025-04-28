import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/auth.controller';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaType } from '@prisma/client';
import { ProjectFilterDto } from './dto/project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: { user: JwtUser }) {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Post(':id/properties')
  @UseGuards(JwtAuthGuard)
  addProperties(
    @Param('id') id: string,
    @Body() propertyIds: string[],
    @Request() req: { user: JwtUser }
  ) {
    return this.projectService.addProperties(id, propertyIds, req.user.userId);
  }

  @Post(':id/media/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMedia(
    @Param('id') id: string,
    @Param('type') type: MediaType,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.projectService.uploadMedia(id, files, type);
  }

  @Delete(':projectId/media/:mediaId')
  @UseGuards(JwtAuthGuard)
  async deleteMedia(
    @Param('projectId') projectId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.projectService.deleteMedia(projectId, mediaId);
  }

  @Get()
  findAll(@Query() filterDto: ProjectFilterDto) {
    return this.projectService.findAll(filterDto);
  }

  @Get('developer/:developerId')
  findByDeveloperId(
    @Param('developerId') developerId: string,
    @Query() filterDto: ProjectFilterDto,
  ) {
    return this.projectService.findAll({ ...filterDto, developerId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.projectService.update(id, updateProjectDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: JwtUser }) {
    return this.projectService.remove(id, req.user.userId);
  }
} 