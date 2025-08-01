import { Body, Controller, Post } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { InitiateRegistrationDto, RegisterBrokerDto } from './dto/registration.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('initiate')
  async initiateRegistration(@Body() dto: InitiateRegistrationDto) {
    return this.registrationService.initiateRegistration(dto);
  }

  @Post('broker')
  async registerBroker(@Body() dto: RegisterBrokerDto) {
    return this.registrationService.registerBroker(dto);
  }
} 