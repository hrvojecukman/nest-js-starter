import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

export interface JwtUser {
  userId: string;
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: AuthDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: AuthDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.logout(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Body() { refreshToken }: { refreshToken: string }, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.refreshToken(user.userId, refreshToken);
  }
}
