import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private push: PushService) {}

  @Post('register')
  async register(@Req() req: Request, @Body() body: { token: string; platform?: 'ios' | 'android' | 'web' }) {
    const user: any = req.user as any;
    return this.push.registerDevice(user.userId ?? user.id, body.token, body.platform ?? 'web');
  }

  @Delete('unregister')
  async unregister(@Body() body: { token: string }) {
    return this.push.unregisterDevice(body.token);
  }
}


