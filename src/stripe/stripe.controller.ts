import { Body, Controller, Post, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/auth.controller';
import { CreatePaymentIntentDto } from './dto/stripe.dto';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-payment-sheet')
  async createPaymentSheet(@Body() dto: CreatePaymentIntentDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return await this.stripeService.createPaymentSheet(user.userId, dto.amount);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!request.rawBody) {
      throw new Error('No raw body found in request');
    }

    const event = JSON.parse(request.rawBody.toString()) as Stripe.Event;
    return this.stripeService.handleWebhookEvent(event);
  }
}
