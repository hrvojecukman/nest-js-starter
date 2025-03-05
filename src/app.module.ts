import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { TwilioModule } from './twilio/twilio.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [AuthModule, UserModule, AdminModule, TwilioModule, VerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
