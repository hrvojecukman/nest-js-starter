import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateSubscriptionPlanDto, 
  UpdateSubscriptionPlanDto, 
  SubscriptionPlanDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionDto,
  SubscriptionPlanFilterDto,
  SubscriptionFilterDto,
  CheckoutSubscriptionDto,
  CheckoutResponseDto,
  WebhookEventDto,
  SubscriptionHistoryDto,
  AdminUpdateSubscriptionDto,
  ExtendSubscriptionDto,
  AdminCreateSubscriptionDto
} from './dto/subscription.dto';
import { Role, SubscriptionStatus, BillingPeriod, PaymentProvider } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
  ) {}

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
    const plan = await this.findSubscriptionPlanById(id);

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency,
        availableTo: dto.availableTo,
        billingPeriod: dto.billingPeriod,
      },
    });
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    const plan = await this.findSubscriptionPlanById(id);

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: 'active',
      },
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
    return this.prisma.subscription.findUnique({
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
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    // Check if user already has an active subscription
    const existingSubscription = await this.getCurrentUserSubscription(userId);
    if (existingSubscription && existingSubscription.status === 'active') {
      throw new BadRequestException('User already has an active subscription');
    }

    const plan = await this.findSubscriptionPlanById(dto.planId);

    // Calculate expiration date based on billing period
    const expiresAt = new Date();
    if (plan.billingPeriod === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Determine initial status based on payment provider
    const initialStatus = dto.paymentProvider === 'manual' ? 'active' : 'pending';
    
    // Set TTL for pending checkouts (30 minutes)
    const checkoutExpiresAt = initialStatus === 'pending' 
      ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      : null;

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: dto.planId,
        expiresAt,
        checkoutExpiresAt,
        status: initialStatus,
        paymentProvider: dto.paymentProvider,
        externalReference: dto.externalReference,
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

  async checkoutSubscription(userId: string, dto: CheckoutSubscriptionDto): Promise<CheckoutResponseDto> {
    const plan = await this.findSubscriptionPlanById(dto.planId);

    // Check if plan is available for user's role
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

    // Check if user already has a subscription
    const existingSubscription = await this.getCurrentUserSubscription(userId);
    
    if (existingSubscription && existingSubscription.status === 'active') {
      throw new BadRequestException('User already has an active subscription. Please cancel the current subscription before creating a new one.');
    }
    
    // If pending subscription exists, delete it first
    if (existingSubscription && existingSubscription.status === 'pending') {
      await this.prisma.subscription.delete({
        where: { id: existingSubscription.id }
      });
    }

    // Create new subscription
    const subscription = await this.createSubscription(userId, {
      planId: dto.planId,
      paymentProvider: dto.paymentProvider,
    });

    // Create checkout session based on payment provider
    let checkoutUrl: string;
    let sessionId: string;

    switch (dto.paymentProvider) {
      case 'stripe':
        // For Stripe payments, return a mock checkout URL
        checkoutUrl = `https://checkout.stripe.com/pay/cs_test_${subscription.id}`;
        sessionId = `cs_test_${subscription.id}`;
        break;

      case 'manual':
        // For manual payments, return a special URL
        checkoutUrl = `/subscription/manual-payment/${subscription.id}`;
        sessionId = subscription.id;
        break;

      default:
        throw new BadRequestException('Invalid payment provider');
    }

    return {
      subscriptionId: subscription.id,
      checkoutUrl,
      sessionId,
      expiresAt: subscription.expiresAt,
    };
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

  async renewSubscription(userId: string): Promise<SubscriptionDto> {
    const subscription = await this.getCurrentUserSubscription(userId);
    
    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    if (subscription.status === 'active') {
      throw new BadRequestException('Subscription is already active');
    }

    // Calculate new expiration date
    const newExpiresAt = new Date();
    if (subscription.plan.billingPeriod === 'monthly') {
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
    } else {
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'pending',
        expiresAt: newExpiresAt,
        autoRenew: true,
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
    // This would typically query a separate history table
    // For now, we'll return the current subscription if it exists
    const subscription = await this.getCurrentUserSubscription(userId);
    
    if (!subscription) {
      return [];
    }

    return [{
      id: subscription.id,
      planName: subscription.plan.name,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      paymentProvider: subscription.paymentProvider,
      price: subscription.plan.price,
      currency: subscription.plan.currency,
    }];
  }

  // ==================== WEBHOOK HANDLING ====================

  async handleWebhook(event: WebhookEventDto): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data);
        break;
      
      default:
        // Log unhandled event types
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(data: any): Promise<void> {
    const subscriptionId = data.object.metadata?.subscriptionId;
    
    if (!subscriptionId) {
      console.warn('No subscription ID in webhook metadata');
      return;
    }

    try {
      // Try to update existing subscription
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'active',
          externalReference: data.object.id,
          checkoutExpiresAt: null, // Clear TTL
        },
      });
      console.log(`Subscription ${subscriptionId} activated successfully`);
    } catch (error) {
      // Subscription might have been cleaned up, create new one
      if (error.code === 'P2025') { // Record not found
        console.log(`Subscription ${subscriptionId} not found, creating new one`);
        await this.prisma.subscription.create({
          data: {
            id: subscriptionId,
            userId: data.object.metadata?.userId,
            planId: data.object.metadata?.planId,
            status: 'active',
            externalReference: data.object.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            autoRenew: true,
            paymentProvider: 'stripe',
          }
        });
        console.log(`New subscription ${subscriptionId} created from webhook`);
      } else {
        console.error('Error handling checkout completed:', error);
        throw error;
      }
    }
  }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    // Handle successful recurring payments
    console.log('Payment succeeded:', data);
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    // Handle failed payments
    console.log('Payment failed:', data);
  }

  private async handleSubscriptionDeleted(data: any): Promise<void> {
    // Handle subscription cancellation
    console.log('Subscription deleted:', data);
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

    if (filters.paymentProvider) {
      where.paymentProvider = filters.paymentProvider;
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
    const subscription = await this.findSubscriptionById(id);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: dto.status,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        autoRenew: dto.autoRenew,
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

  async extendSubscription(id: string, dto: ExtendSubscriptionDto): Promise<SubscriptionDto> {
    const subscription = await this.findSubscriptionById(id);

    const newExpiresAt = new Date(subscription.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + dto.daysToExtend);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
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
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if plan exists
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId: dto.userId },
    });

    if (existingSubscription) {
      throw new BadRequestException('User already has a subscription');
    }

    // Calculate dates
    const startedAt = dto.startedAt ? new Date(dto.startedAt) : new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : this.calculateExpirationDate(startedAt, plan.billingPeriod);

    return this.prisma.subscription.create({
      data: {
        userId: dto.userId,
        planId: dto.planId,
        startedAt,
        expiresAt,
        autoRenew: dto.autoRenew ?? true,
        status: dto.status ?? 'active',
        paymentProvider: dto.paymentProvider,
        externalReference: dto.externalReference,
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
    const daysUntilExpiry = Math.ceil(
      (subscription.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      hasActiveSubscription: true,
      subscription,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
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

  async cleanupExpiredCheckouts(): Promise<{ deletedCount: number }> {
    const expiredCheckouts = await this.prisma.subscription.findMany({
      where: {
        status: 'pending',
        checkoutExpiresAt: { lt: new Date() },
      },
      select: { id: true },
    });

    if (expiredCheckouts.length > 0) {
      const deletedCount = await this.prisma.subscription.deleteMany({
        where: {
          id: { in: expiredCheckouts.map(s => s.id) },
        },
      });
      
      console.log(`Cleaned up ${deletedCount.count} expired checkouts`);
      return { deletedCount: deletedCount.count };
    }

    return { deletedCount: 0 };
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
} 