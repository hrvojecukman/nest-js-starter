import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createPaymentSheet(userId: string, amount: number) {
    try {
      // Get or create customer
      const customer = await this.getOrCreateCustomer(userId);

      // Create ephemeral key
      const ephemeralKey = await this.stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2025-02-24.acacia' },
      );

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record
      await this.prisma.payment.create({
        data: {
          userId,
          amount,
          currency: 'usd',
          status: PaymentStatus.PENDING,
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      return {
        customerId: customer.id,
        ephemeralKeySecret: ephemeralKey.secret,
        paymentIntent: paymentIntent.client_secret,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Error creating payment sheet: ${error.message}`);
      }
      throw new BadRequestException('Error creating payment sheet');
    }
  }

  private async getOrCreateCustomer(userId: string) {
    // Check if user already has a Stripe customer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      return await this.stripe.customers.retrieve(user.stripeCustomerId);
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      metadata: {
        userId,
      },
    });

    // Save customer ID to user
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  async handleWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          await this.handleSuccessfulPayment(paymentIntent);
          break;
        }
        case 'payment_intent.payment_failed': {
          const failedPayment = event.data.object;
          await this.handleFailedPayment(failedPayment);
          break;
        }
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw new BadRequestException('Error processing webhook event');
    }
  }

  private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    await this.prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });
  }

  private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
    await this.prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: PaymentStatus.FAILED },
    });
  }
}
