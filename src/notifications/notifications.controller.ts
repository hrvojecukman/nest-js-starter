import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../role/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtUser } from 'src/auth/auth.controller';


@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: Request, @Query() q: ListNotificationsDto) {
    const user = req.user as JwtUser;
    return this.svc.list(user.userId, q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  unread(@Req() req: Request) { 
    const user = req.user as JwtUser;
    return this.svc.unreadCount(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/read')
  markRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtUser;
    return this.svc.markRead(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('read-all')
  markAll(@Req() req: Request, @Body('category') category?: string) {
    const user = req.user as JwtUser;
    return this.svc.markAllRead(user.userId, category);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.svc.createDirect(dto);
  }
}


