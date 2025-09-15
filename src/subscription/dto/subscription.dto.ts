import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsArray, IsNumber, Min, Max, IsNotEmpty, ValidateNested, IsUUID, IsDateString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, SubscriptionStatus, BillingPeriod, Platform, TransactionType, TransactionStatus } from '@prisma/client';

// ==================== SUBSCRIPTION PLANS ====================

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsArray()
  @IsEnum(Role, { each: true })
  availableTo: Role[];

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;
}

export class UpdateSubscriptionPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  @IsOptional()
  availableTo?: Role[];

  @IsEnum(BillingPeriod)
  @IsOptional()
  billingPeriod?: BillingPeriod;
}

export class SubscriptionPlanDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  availableTo: Role[];
  billingPeriod: BillingPeriod;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SUBSCRIPTIONS ====================

export class SubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  startedAt: Date;
  expiresAt: Date;
  autoRenew: boolean;
  status: SubscriptionStatus;
  externalId: string | null;
  metadata: any;
  plan: SubscriptionPlanDto;
  user: {
    id: string;
    name: string;
    email: string | null;
    role: Role;
  };
}

// ==================== TRANSACTIONS ====================

export class CreateTransactionDto {
  @IsUUID()
  userId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus = 'completed';

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @IsUUID()
  @IsOptional()
  planId?: string;
}

export class TransactionDto {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  externalId: string | null;
  metadata: any;
  createdAt: Date;
  subscriptionId: string | null;
  planId: string | null;
}

// ==================== FILTERS ====================

export class SubscriptionPlanFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class SubscriptionFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;

  @IsOptional()
  @IsEnum(Role)
  userRole?: Role;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsDateString()
  startedAfter?: string;

  @IsOptional()
  @IsDateString()
  startedBefore?: string;

  @IsOptional()
  @IsDateString()
  expiresAfter?: string;

  @IsOptional()
  @IsDateString()
  expiresBefore?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class TransactionFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// ==================== ADMIN DTOs ====================

export class AdminUpdateSubscriptionDto {
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class ExtendSubscriptionDto {
  @IsNumber()
  @Min(1)
  @Max(365)
  daysToExtend: number;
}

export class AdminCreateSubscriptionDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  planId: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean = true;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus = 'active';

  @IsString()
  @IsOptional()
  externalId?: string;
}

// ==================== MOBILE-FIRST DTOs ====================

export class ActivateSubscriptionDto {
  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  @IsNotEmpty()
  receiptData: string; // Base64 encoded receipt

  @IsUUID()
  planId: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  originalTransactionId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  purchaseToken?: string; // Android specific

  @IsString()
  @IsOptional()
  bundleId?: string; // iOS specific

  @IsNumber()
  @IsOptional()
  purchaseTime?: number;

  @IsNumber()
  @IsOptional()
  expiresTime?: number;
}

export class SubscriptionActivationResponseDto {
  subscriptionId: string;
  status: SubscriptionStatus;
  expiresAt: Date;
  platform: Platform;
  externalId?: string;
}

export class RefreshSubscriptionDto {
  @IsUUID()
  subscriptionId: string;

  @IsEnum(Platform)
  platform: Platform;
}

export class SubscriptionRefreshResponseDto {
  subscriptionId: string;
  isValid: boolean;
  status: SubscriptionStatus;
  expiresAt?: Date;
  error?: string;
}

// ==================== RESPONSE DTOs ====================

export class SubscriptionHistoryDto {
  id: string;
  planName: string;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date;
  platform: Platform;
  price: number;
  currency: string;
}
