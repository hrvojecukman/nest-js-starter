import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RegistrationModule } from './registration/registration.module';
import { PrismaModule } from './prisma/prisma.module';
import { TwilioModule } from './twilio/twilio.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { VerificationModule } from './verification/verification.module';
import { PropertyModule } from './property/property.module';
import { ProjectModule } from './project/project.module';
import { S3Module } from './s3/s3.module';
import { UsersModule } from './users/users.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    RegistrationModule,
    PrismaModule,
    TwilioModule,
    UserModule,
    AdminModule,
    VerificationModule,
    PropertyModule,
    ProjectModule,
    S3Module,
    UsersModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
