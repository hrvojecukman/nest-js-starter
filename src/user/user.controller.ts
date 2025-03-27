import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { Request } from 'express';
import { JwtUser } from 'src/auth/auth.controller';
import {
  OwnerDetailsDto,
  DeveloperDetailsDto,
  BrokerDetailsDto,
  BuyerDetailsDto,
} from '../auth/dto/auth.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.getUserById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile/buyer')
  async updateBuyerDetails(@Body() dto: BuyerDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.updateRoleDetails(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile/owner')
  async updateOwnerDetails(@Body() dto: OwnerDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.updateRoleDetails(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile/developer')
  async updateDeveloperDetails(@Body() dto: DeveloperDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.updateRoleDetails(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile/broker')
  async updateBrokerDetails(@Body() dto: BrokerDetailsDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.updateRoleDetails(user.userId, dto);
  }
}
