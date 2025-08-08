import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsBoolean, 
  IsDateString,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  IsNotEmpty,
  IsObject
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role, SubscriptionStatus, BillingPeriod, PaymentProvider } from '@prisma/client';

// Subscription Plan DTOs
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

// Subscription DTOs
export class CreateSubscriptionDto {
  @IsUUID()
  planId: string;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsString()
  @IsOptional()
  externalReference?: string;
}

export class UpdateSubscriptionDto {
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class SubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  startedAt: Date;
  expiresAt: Date;
  autoRenew: boolean;
  status: SubscriptionStatus;
  paymentProvider: PaymentProvider;
  externalReference: string | null;
  plan: SubscriptionPlanDto;
  user: {
    id: string;
    name: string;
    email: string | null;
    role: Role;
  };
}

// Filter DTOs
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
  @IsEnum(PaymentProvider)
  paymentProvider?: PaymentProvider;

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

// Checkout DTOs
export class CheckoutSubscriptionDto {
  @IsUUID()
  planId: string;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

export class CheckoutResponseDto {
  subscriptionId: string;
  checkoutUrl: string;
  sessionId: string;
  expiresAt: Date;
}

// Webhook DTOs
export class WebhookDataDto {
  object?: any;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class WebhookEventDto {
  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  id?: string;

  @ValidateNested()
  @Type(() => WebhookDataDto)
  data: WebhookDataDto;
}

// Response DTOs
export class SubscriptionHistoryDto {
  id: string;
  planName: string;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date;
  paymentProvider: PaymentProvider;
  price: number;
  currency: string;
}

// Admin DTOs
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

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

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
  externalReference?: string;
} 