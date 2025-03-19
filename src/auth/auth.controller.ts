import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  InitiateLoginDto,
  VerifyLoginOtpDto,
  OwnerDetailsDto,
  DeveloperDetailsDto,
  BrokerDetailsDto,
  Role,
  BuyerDetailsDto,
} from './dto/auth.dto';
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

  @UseGuards(JwtAuthGuard)
  @Post('role-details/buyer')
  async updateBuyerDetails(@Body() dto: BuyerDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.updateRoleDetails(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('role-details/owner')
  async updateOwnerDetails(@Body() dto: OwnerDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.updateRoleDetails(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('role-details/developer')
  async updateDeveloperDetails(@Body() dto: DeveloperDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.updateRoleDetails(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('role-details/broker')
  async updateBrokerDetails(@Body() dto: BrokerDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.authService.updateRoleDetails(user.userId, dto);
  }
}
