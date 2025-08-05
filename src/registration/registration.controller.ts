import { Body, Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RegistrationService } from './registration.service';
import { InitiateRegistrationDto, RegisterBrokerDto, RegisterDeveloperDto, RegisterOwnerDto } from './dto/registration.dto';

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

  @Post('owner')
  async registerOwner(@Body() dto: RegisterOwnerDto) {
    return this.registrationService.registerOwner(dto);
  }
  
  @Post('developer')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'commercialRegistration', maxCount: 1 },
    { name: 'taxCertificate', maxCount: 1 },
    { name: 'valBrokerageLicense', maxCount: 1 },
    { name: 'realEstateDevelopmentLicense', maxCount: 1 },
    { name: 'officialCompanyLogo', maxCount: 1 },
  ]))
  async registerDeveloper(@Body() dto: RegisterDeveloperDto, @UploadedFiles() files?: { [fieldname: string]: Express.Multer.File[] }) {
    return this.registrationService.registerDeveloper(dto, files);
  }
} 