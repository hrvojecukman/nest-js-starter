import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TwilioModule } from './twilio/twilio.module';
import { UserModule } from './user/user.module';
import { StripeModule } from './stripe/stripe.module';
import { AdminModule } from './admin/admin.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    TwilioModule,
    UserModule,
    StripeModule,
    AdminModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
