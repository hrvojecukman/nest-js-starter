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
  UsePipes,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanFilterDto,
  SubscriptionFilterDto,
  CheckoutSubscriptionDto,
  WebhookEventDto,
  AdminUpdateSubscriptionDto,
  ExtendSubscriptionDto,
  AdminCreateSubscriptionDto,
} from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../role/roles.decorator';
import { Role } from '@prisma/client';
import { JwtUser } from 'src/auth/auth.controller';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ==================== USER ENDPOINTS ====================

  @Get('plans')
  @UseGuards(JwtAuthGuard)
  async getAvailablePlans(@Request() req: { user: JwtUser }) {
    const userRole = req.user.role;
    return this.subscriptionService.findSubscriptionPlansByUserRole(userRole);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.getCurrentUserSubscription(userId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async checkoutSubscription(@Request() req: { user: JwtUser }, @Body() dto: CheckoutSubscriptionDto) {
    const userId = req.user.userId;
    return this.subscriptionService.checkoutSubscription(userId, dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.cancelSubscription(userId);
  }

  @Post('renew')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async renewSubscription(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.renewSubscription(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionHistory(@Request() req: { user: JwtUser }) {
    const userId = req.user.userId;
    return this.subscriptionService.getSubscriptionHistory(userId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, skipNullProperties: true, skipUndefinedProperties: true }))
  async handleWebhook(@Body() event: any) {
    await this.subscriptionService.handleWebhook(event);
    return { received: true };
  }

  @Post('webhook-test')
  @HttpCode(HttpStatus.OK)
  async handleWebhookTest(@Body() event: any) {
    await this.subscriptionService.handleWebhook(event);
    return { received: true };
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
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionService.updateSubscriptionPlan(id, dto);
  }

  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscriptionPlan(@Param('id') id: string) {
    await this.subscriptionService.deleteSubscriptionPlan(id);
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
  async updateSubscriptionStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updateSubscriptionStatus(id, dto);
  }

  @Post('admin/subscriptions/:id/extend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async extendSubscription(
    @Param('id') id: string,
    @Body() dto: ExtendSubscriptionDto,
  ) {
    return this.subscriptionService.extendSubscription(id, dto);
  }

  @Post('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createSubscriptionByAdmin(@Body() dto: AdminCreateSubscriptionDto) {
    return this.subscriptionService.createSubscriptionByAdmin(dto);
  }

  @Post('admin/cleanup-expired-checkouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async cleanupExpiredCheckouts() {
    return this.subscriptionService.cleanupExpiredCheckouts();
  }
} 