import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../role/roles.decorator';
import { Role } from '@prisma/client';
type JwtUser = { userId: string; phoneNumber: string; role: string };
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanFilterDto,
  SubscriptionFilterDto,
  AdminUpdateSubscriptionDto,
  ExtendSubscriptionDto,
  AdminCreateSubscriptionDto,
  ActivateSubscriptionDto,
  RefreshSubscriptionDto,
} from './dto/subscription.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ==================== USER ENDPOINTS ====================

  @Get('plans')
  @UseGuards(JwtAuthGuard)
  async getAvailablePlans(@Request() req: { user: JwtUser }) {
    const userRole = req.user.role as Role;
    return this.subscriptionService.findSubscriptionPlansByUserRole(userRole);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.getCurrentUserSubscription(userId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.cancelSubscription(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionHistory(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.getSubscriptionHistory(userId);
  }

  // ==================== MOBILE-FIRST ENDPOINTS ====================

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  async activateSubscription(@Request() req: { user: JwtUser }, @Body() dto: ActivateSubscriptionDto) {
    const userId = req.user.userId;
    return this.subscriptionService.activateSubscription(userId, dto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshSubscription(@Body() dto: RefreshSubscriptionDto) {
    return this.subscriptionService.refreshSubscription(dto);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllSubscriptionPlans(@Query() filters: SubscriptionPlanFilterDto) {
    return this.subscriptionService.findAllSubscriptionPlans(filters);
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createSubscriptionPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createSubscriptionPlan(dto);
  }

  @Put('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSubscriptionPlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionService.updateSubscriptionPlan(id, dto);
  }

  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscriptionPlan(@Param('id') id: string) {
    return this.subscriptionService.deleteSubscriptionPlan(id);
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllSubscriptions(@Query() filters: SubscriptionFilterDto) {
    return this.subscriptionService.findAllSubscriptions(filters);
  }

  @Get('admin/subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getSubscriptionById(@Param('id') id: string) {
    return this.subscriptionService.findSubscriptionById(id);
  }

  @Put('admin/subscriptions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSubscriptionStatus(@Param('id') id: string, @Body() dto: AdminUpdateSubscriptionDto) {
    return this.subscriptionService.updateSubscriptionStatus(id, dto);
  }

  @Post('admin/subscriptions/:id/extend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async extendSubscription(@Param('id') id: string, @Body() dto: ExtendSubscriptionDto) {
    return this.subscriptionService.extendSubscription(id, dto);
  }

  @Post('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createSubscriptionByAdmin(@Body() dto: AdminCreateSubscriptionDto) {
    return this.subscriptionService.createSubscriptionByAdmin(dto);
  }
}
