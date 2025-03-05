import { Controller, Post, Body } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { IsString, IsPhoneNumber } from 'class-validator';

class SendOtpDto {
  @IsPhoneNumber()
  phoneNumber: string;
}

class VerifyOtpDto {
  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  code: string;
}

@Controller('verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto): Promise<{ success: boolean }> {
    const success = await this.verificationService.sendOtp(dto.phoneNumber);
    return { success };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ success: boolean }> {
    const success = await this.verificationService.verifyOtp(dto.phoneNumber, dto.code);
    return { success };
  }
}
