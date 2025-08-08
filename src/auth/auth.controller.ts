import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitiateLoginDto, VerifyLoginOtpDto, AdminLoginDto, AdminRegisterDto, Role } from './dto/auth.dto';
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

  @Post('initiate')
  async initiateAuth(@Body() dto: InitiateLoginDto) {
    return this.authService.initiateAuth(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyLoginOtpDto) {
    return this.authService.verifyOtpAndLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.refreshToken(user.userId);
  }

  @Post('admin/login')
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('admin/register')
  async adminRegister(@Body() dto: AdminRegisterDto) {
    return this.authService.adminRegister(dto);
  }
}
