import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateSubscriptionPlanDto, 
  UpdateSubscriptionPlanDto, 
  SubscriptionPlanDto,
  SubscriptionDto,
  SubscriptionPlanFilterDto,
  SubscriptionFilterDto,
  SubscriptionHistoryDto,
  AdminUpdateSubscriptionDto,
  ExtendSubscriptionDto,
  AdminCreateSubscriptionDto,
  ActivateSubscriptionDto,
  SubscriptionActivationResponseDto,
  RefreshSubscriptionDto,
  SubscriptionRefreshResponseDto,
  CreateTransactionDto,
  TransactionDto,
  TransactionFilterDto
} from './dto/subscription.dto';
import { Role, SubscriptionStatus, BillingPeriod, Platform } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== SUBSCRIPTION PLANS ====================

  async createSubscriptionPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'USD',
        availableTo: dto.availableTo,
        billingPeriod: dto.billingPeriod,
      },
    });
  }

  async findAllSubscriptionPlans(filters: SubscriptionPlanFilterDto): Promise<{
    plans: SubscriptionPlanDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role) {
      where.availableTo = { has: filters.role };
    }

    if (filters.billingPeriod) {
      where.billingPeriod = filters.billingPeriod;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [plans, total] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscriptionPlan.count({ where }),
    ]);

    return {
      plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubscriptionPlansByUserRole(userRole: Role): Promise<SubscriptionPlanDto[]> {
    return this.prisma.subscriptionPlan.findMany({
      where: {
        availableTo: { has: userRole },
      },
      orderBy: { price: 'asc' },
    });
  }

  async findSubscriptionPlanById(id: string): Promise<SubscriptionPlanDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async updateSubscriptionPlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    await this.findSubscriptionPlanById(id);

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await this.findSubscriptionPlanById(id);

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { planId: id, status: 'active' },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }

  // ==================== USER SUBSCRIPTIONS ====================

  async getCurrentUserSubscription(userId: string): Promise<SubscriptionDto | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return subscription;
  }

  async cancelSubscription(userId: string): Promise<SubscriptionDto> {
    const subscription = await this.getCurrentUserSubscription(userId);
    
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Subscription is not active');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        autoRenew: false,
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getSubscriptionHistory(userId: string): Promise<SubscriptionHistoryDto[]> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: true,
      },
    });
    
    if (!subscription) {
      return [];
    }

    return [{
      id: subscription.id,
      planName: subscription.plan.name,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      platform: subscription.platform,
      price: subscription.plan.price,
      currency: subscription.plan.currency,
    }];
  }

  // ==================== ADMIN METHODS ====================

  async findAllSubscriptions(filters: SubscriptionFilterDto): Promise<{
    subscriptions: SubscriptionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { plan: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.platform) {
      where.platform = filters.platform;
    }

    if (filters.userRole) {
      where.user = { role: filters.userRole };
    }

    if (filters.planId) {
      where.planId = filters.planId;
    }

    if (filters.startedAfter) {
      where.startedAt = { gte: new Date(filters.startedAfter) };
    }

    if (filters.startedBefore) {
      where.startedAt = { ...where.startedAt, lte: new Date(filters.startedBefore) };
    }

    if (filters.expiresAfter) {
      where.expiresAt = { gte: new Date(filters.expiresAfter) };
    }

    if (filters.expiresBefore) {
      where.expiresAt = { ...where.expiresAt, lte: new Date(filters.expiresBefore) };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubscriptionById(id: string): Promise<SubscriptionDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updateSubscriptionStatus(id: string, dto: AdminUpdateSubscriptionDto): Promise<SubscriptionDto> {
    await this.findSubscriptionById(id);

    return this.prisma.subscription.update({
      where: { id },
      data: dto,
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async extendSubscription(id: string, dto: ExtendSubscriptionDto): Promise<SubscriptionDto> {
    const subscription = await this.findSubscriptionById(id);

    const newExpiresAt = new Date(subscription.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + dto.daysToExtend);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        status: 'active',
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async createSubscriptionByAdmin(dto: AdminCreateSubscriptionDto): Promise<SubscriptionDto> {
    // Validate plan exists
    const plan = await this.findSubscriptionPlanById(dto.planId);
    
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if plan is available for user's role
    if (!plan.availableTo.includes(user.role)) {
      throw new ForbiddenException('This plan is not available for the specified user role');
    }

    // Check if user already has a subscription
    const existingSubscription = await this.getCurrentUserSubscription(dto.userId);
    if (existingSubscription) {
      throw new BadRequestException('User already has a subscription');
    }

    // Calculate expiration date
    const startedAt = dto.startedAt ? new Date(dto.startedAt) : new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : this.calculateExpirationDate(startedAt, plan.billingPeriod);

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId: dto.userId,
        planId: dto.planId,
        status: dto.status || 'active',
        platform: dto.platform,
        externalId: dto.externalId,
        startedAt,
        expiresAt,
        autoRenew: dto.autoRenew ?? true,
      },
    });

    // Return with plan and user data
    return this.findSubscriptionById(subscription.id);
  }

  // ==================== UTILITY METHODS ====================

  async checkSubscriptionStatus(userId: string): Promise<{
    hasActiveSubscription: boolean;
    subscription?: SubscriptionDto;
    daysUntilExpiry?: number;
  }> {
    const subscription = await this.getCurrentUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      return { hasActiveSubscription: false };
    }

    const now = new Date();
    const daysUntilExpiry = Math.ceil((subscription.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      hasActiveSubscription: true,
      subscription,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
    };
  }

  async processExpiredSubscriptions(): Promise<void> {
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
    });

    for (const subscription of expiredSubscriptions) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' },
      });
    }
  }

  private calculateExpirationDate(startedAt: Date, billingPeriod: BillingPeriod): Date {
    const expirationDate = new Date(startedAt);
    
    switch (billingPeriod) {
      case 'monthly':
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        break;
      case 'yearly':
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException('Invalid billing period');
    }
    
    return expirationDate;
  }

  // ==================== MOBILE-FIRST METHODS ====================

  async activateSubscription(userId: string, dto: ActivateSubscriptionDto): Promise<SubscriptionActivationResponseDto> {
    // Check if user already has an active subscription
    const existingSubscription = await this.getCurrentUserSubscription(userId);
    if (existingSubscription && existingSubscription.status === 'active') {
      throw new BadRequestException('User already has an active subscription');
    }

    // Validate plan exists and is available for user's role
    const plan = await this.findSubscriptionPlanById(dto.planId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!plan.availableTo.includes(user.role)) {
      throw new ForbiddenException('This plan is not available for your role');
    }

    // Create metadata with platform-specific details
    const metadata = {
      platform: dto.platform,
      receiptData: dto.receiptData,
      transactionId: dto.transactionId,
      originalTransactionId: dto.originalTransactionId,
      productId: dto.productId || dto.planId,
      purchaseToken: dto.purchaseToken,
      bundleId: dto.bundleId,
      purchaseTime: dto.purchaseTime,
      expiresTime: dto.expiresTime,
    };

    // Calculate expiration date
    const startedAt = new Date();
    const expiresAt = this.calculateExpirationDate(startedAt, plan.billingPeriod);

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: dto.planId,
        status: 'active',
        platform: dto.platform,
        externalId: dto.transactionId,
        metadata,
        startedAt,
        expiresAt,
        autoRenew: true,
      },
    });

    // Create transaction record
    await this.createTransaction({
      userId,
      type: 'subscription_start',
      amount: plan.price,
      currency: plan.currency,
      status: 'completed',
      externalId: dto.transactionId,
      metadata,
      subscriptionId: subscription.id,
      planId: dto.planId,
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      expiresAt: subscription.expiresAt,
      platform: dto.platform,
      externalId: dto.transactionId || undefined,
    };
  }

  async refreshSubscription(dto: RefreshSubscriptionDto): Promise<SubscriptionRefreshResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        subscriptionId: dto.subscriptionId,
        isValid: false,
        status: 'expired',
        error: 'Subscription not found',
      };
    }

    // For now, return basic validation
    // In production, you would validate with platform-specific APIs
    const isValid = subscription.status === 'active' && subscription.expiresAt > new Date();

    return {
      subscriptionId: dto.subscriptionId,
      isValid,
      status: subscription.status,
      expiresAt: subscription.expiresAt,
      error: isValid ? undefined : 'Subscription is not valid or has expired',
    };
  }

  // ==================== TRANSACTIONS ====================

  async createTransaction(dto: CreateTransactionDto): Promise<TransactionDto> {
    return this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        status: 'completed', // Default to completed for now
        externalId: dto.externalId,
        metadata: dto.metadata,
        subscriptionId: dto.subscriptionId,
        planId: dto.planId,
      },
    });
  }

  async findAllTransactions(filters: TransactionFilterDto): Promise<{
    transactions: TransactionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters.createdAfter) {
      where.createdAt = { gte: new Date(filters.createdAfter) };
    }

    if (filters.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.createdBefore) };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
