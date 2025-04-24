import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';

import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from 'src/role/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users/:role')
  async getUsersByRole(@Param('role') role: Role) {
    return this.adminService.getUsersByRole(role);
  }
}
