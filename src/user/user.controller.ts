import { Controller, Get, Post, Delete, UseGuards, Req, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { Request } from 'express';
import { JwtUser } from 'src/auth/auth.controller';
import { FileInterceptor } from '@nestjs/platform-express';
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

  // Profile Image CRUD APIs
  @UseGuards(JwtAuthGuard)
  @Post('profile-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.uploadProfileImage(user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile-image')
  async deleteProfileImage(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.deleteProfileImage(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile-image')
  async getProfileImage(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.userService.getProfileImage(user.userId);
  }
}
