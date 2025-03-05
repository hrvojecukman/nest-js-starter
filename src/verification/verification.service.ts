import { Injectable } from '@nestjs/common';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class VerificationService {
  constructor(private twilioService: TwilioService) {}

  async sendOtp(phoneNumber: string): Promise<boolean> {
    return this.twilioService.sendOtp(phoneNumber);
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    return this.twilioService.verifyOtp(phoneNumber, code);
  }
}
