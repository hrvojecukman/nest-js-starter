import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { TwilioModule } from '../twilio/twilio.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationController } from './verification.controller';

@Module({
  imports: [TwilioModule, PrismaModule],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}
