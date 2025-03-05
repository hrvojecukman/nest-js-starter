import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CompleteRegistrationDto, InitiateLoginDto, VerifyLoginOtpDto, Role } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

export interface JwtUser {
  userId: string;
  phoneNumber: string;
  role: Role;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: CompleteRegistrationDto,
    @Headers('admin-secret') adminSecret?: string,
  ) {
    if (
      dto.role === Role.ADMIN &&
      (!adminSecret || adminSecret !== process.env.ADMIN_CREATION_SECRET)
    ) {
      throw new UnauthorizedException('Invalid or missing admin secret key.');
    }

    return this.authService.register(dto, adminSecret);
  }

  @Post('initiate')
  async initiateAuth(@Body() dto: InitiateLoginDto) {
    return this.authService.initiateAuth(dto);
  }

  @Post('login')
  async login(@Body() dto: VerifyLoginOtpDto) {
    return this.authService.verifyOtpAndLogin(dto);
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
