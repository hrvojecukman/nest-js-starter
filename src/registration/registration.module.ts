import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    PrismaModule,
    TwilioModule,
    AuthModule,
    S3Module,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {} 