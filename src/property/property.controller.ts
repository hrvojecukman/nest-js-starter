import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto, PropertyFilterDto } from './dto/property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaType } from '@prisma/client';
import { JwtUser } from '../auth/auth.controller';

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: { user: JwtUser }) {
    return this.propertyService.create(createPropertyDto, req.user.userId);
  }

  @Post(':id/media/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMedia(
    @Param('id') id: string,
    @Param('type') type: MediaType,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.propertyService.uploadMedia(id, files, type);
  }

  @Delete(':propertyId/media/:mediaId')
  @UseGuards(JwtAuthGuard)
  async deleteMedia(
    @Param('propertyId') propertyId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.propertyService.deleteMedia(propertyId, mediaId);
  }

  @Get()
  findAll(@Query() filterDto: PropertyFilterDto) {
    return this.propertyService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePropertyDto: Partial<CreatePropertyDto>) {
    return this.propertyService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }
}
