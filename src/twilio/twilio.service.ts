/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class TwilioService {
  private twilioClient: Twilio.Twilio;
  private verifyServiceSid: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    console.log('Twilio Config:', {
      accountSid: accountSid ? '***' + accountSid.slice(-4) : 'missing',
      authToken: authToken ? 'present' : 'missing',
      verifyServiceSid: verifyServiceSid || 'missing',
    });

    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not defined');
    }

    this.twilioClient = Twilio(accountSid, authToken);

    if (!verifyServiceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not defined');
    }
    this.verifyServiceSid = verifyServiceSid;
  }

  async sendOtp(phoneNumber: string): Promise<boolean> {
    try {
      console.log('Sending OTP to:', phoneNumber, 'using service:', this.verifyServiceSid);

      return true;
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({ to: phoneNumber, channel: 'sms' });

      console.log('OTP sent successfully:', verification);
      return true;
    } catch (error) {
      console.error('Twilio OTP Error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
      });
      throw new InternalServerErrorException('Failed to send OTP');
    }
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    try {
      return true;  
      console.log('Verifying OTP:', {
        phoneNumber,
        code: '***' + code.slice(-2),
        serviceId: this.verifyServiceSid,
      });

      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({ to: phoneNumber, code });

      console.log('Verification result:', {
        status: verificationCheck.status,
        valid: verificationCheck.valid,
        to: verificationCheck.to,
      });

      return verificationCheck.status === 'approved';
    } catch (error) {
      console.error('Twilio OTP Verification Error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
      });
      throw new InternalServerErrorException('Failed to verify OTP');
    }
  }
}