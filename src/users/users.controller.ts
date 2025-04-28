import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersFilterDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/role/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('developers')
  findAllDevelopers(@Query() filterDto: UsersFilterDto) {
    return this.usersService.findAll({ ...filterDto, role: Role.DEVELOPER });
  }

  @Get('brokers')
  findAllBrokers(@Query() filterDto: UsersFilterDto) {
    return this.usersService.findAll({ ...filterDto, role: Role.BROKER });
  }

  @Get('developers/:id')
  findOneDeveloper(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('brokers/:id')
  findOneBroker(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() filterDto: UsersFilterDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
} 