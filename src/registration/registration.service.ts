import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, DeveloperDocumentType } from '@prisma/client';
import { TwilioService } from '../twilio/twilio.service';
import { AuthService } from '../auth/auth.service';
import { S3Service } from '../s3/s3.service';
import { InitiateRegistrationDto, RegisterBrokerDto, RegisterOwnerDto, RegisterDeveloperDto } from './dto/registration.dto';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  private async checkUserExists(phoneNumber: string, email?: string) {
    const existingUserByPhone = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUserByPhone) {
      throw new ConflictException('User with this phone number already exists');
    }

    if (email) {
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

      if (existingUserByEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }
  }

  async initiateRegistration(dto: InitiateRegistrationDto) {
    // Check if user already exists
    await this.checkUserExists(dto.phoneNumber, dto.email);

    // Send OTP
    await this.twilioService.sendOtp(dto.phoneNumber);

    return {
      status: 'REGISTRATION_OTP_SENT',
      phoneNumber: dto.phoneNumber,
    };
  }

  async registerBroker(dto: RegisterBrokerDto) {
    // Verify OTP first
    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if user already exists
    await this.checkUserExists(dto.phoneNumber);

    // Create user with broker details
    const newUser = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        role: Role.BROKER,
        Broker: {
          create: {
            lastName: dto.lastName,
            licenseNumber: dto.licenseNumber,
            description: dto.description,
            propertyType: dto.propertyType,
            expectedNumberOfAdsPerMonth: dto.expectedNumberOfAdsPerMonth,
            hasExecutedSalesTransaction: dto.hasExecutedSalesTransaction,
            useDigitalPromotion: dto.useDigitalPromotion,
            wantsAdvertising: dto.wantsAdvertising,
          },
        },
      },
      include: {
        Broker: true,
      },
    });

    // Use auth service to generate tokens
    const tokens = await this.authService.generateTokens(
      newUser.id,
      newUser.phoneNumber,
      Role.BROKER,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        broker: newUser.Broker,
      },
    };
  }

  async registerOwner(dto: RegisterOwnerDto) {
    // Verify OTP first
    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if user already exists
    await this.checkUserExists(dto.phoneNumber);

    // Create user with owner details
    const newUser = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        role: Role.OWNER,
        Owner: {
          create: {
            lastName: dto.lastName,
            doesOwnProperty: dto.doesOwnProperty,
            propertyType: dto.propertyType,
            doesOwnPropertyWithElectronicDeed: dto.doesOwnPropertyWithElectronicDeed,
            purposeOfRegistration: dto.purposeOfRegistration,
            developerPartnership: dto.developerPartnership,
            lookingForDeveloperPartnership: dto.lookingForDeveloperPartnership,
          },
        },
      },
      include: {
        Owner: true,
      },
    });

    // Use auth service to generate tokens
    const tokens = await this.authService.generateTokens(
      newUser.id,
      newUser.phoneNumber,
      Role.OWNER,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        owner: newUser.Owner,
      },
    };
  }

  async registerDeveloper(dto: RegisterDeveloperDto, files?: { [fieldname: string]: Express.Multer.File[] }) {
    // Verify OTP first
    const isOtpValid = await this.twilioService.verifyOtp(dto.phoneNumber, dto.otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if user already exists
    await this.checkUserExists(dto.phoneNumber, dto.representativeEmail);

    // Validate that all required documents are provided with correct names
    if (!files) {
      throw new BadRequestException('All 5 required documents must be provided: commercialRegistration, taxCertificate, valBrokerageLicense, realEstateDevelopmentLicense, officialCompanyLogo');
    }

    // Get all files from the object
    const allFiles = Object.values(files).flat();
    
    if (allFiles.length < 5) {
      throw new BadRequestException('All 5 required documents must be provided: commercialRegistration, taxCertificate, valBrokerageLicense, realEstateDevelopmentLicense, officialCompanyLogo');
    }

    const nonPdf = allFiles.find(file => {
      const validPdfMimeTypes = ['application/pdf', 'application/octet-stream'];
      const hasValidMimeType = validPdfMimeTypes.includes(file.mimetype);
      const hasPdfExtension = file.originalname.toLowerCase().endsWith('.pdf');
      return !hasValidMimeType && !hasPdfExtension;
    });

    if (nonPdf) {
      throw new BadRequestException('Only PDF files are allowed for developer documents');
    }

    // Validate file names match expected document types
    const expectedFileNames = [
      'commercialRegistration',
      'taxCertificate', 
      'valBrokerageLicense',
      'realEstateDevelopmentLicense',
      'officialCompanyLogo'
    ];

    const actualFileNames = Object.keys(files);
    const missingFiles = expectedFileNames.filter(expected => !actualFileNames.includes(expected));
    
    if (missingFiles.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missingFiles.join(', ')}`);
    }

    const extraFiles = actualFileNames.filter(actual => !expectedFileNames.includes(actual));
    if (extraFiles.length > 0) {
      throw new BadRequestException(`Unexpected files provided: ${extraFiles.join(', ')}`);
    }

    // Use transaction to ensure everything succeeds or fails together
    return await this.prisma.$transaction(async (tx) => {
      // Create user with developer details
      const newUser = await tx.user.create({
        data: {
          email: dto.representativeEmail,
          phoneNumber: dto.phoneNumber,
          name: dto.companyName,
          role: Role.DEVELOPER,
          Developer: {
            create: {
              // Company info
              companyName: dto.companyName,
              entityType: dto.entityType,
              developerCity: dto.developerCity,
              propertyType: dto.propertyType,
              annualProjectCount: dto.annualProjectCount,
              totalNumberOfUnits: dto.totalNumberOfUnits,
              
              // Representative info
              representativeName: dto.representativeName,
              representativePhone: dto.representativePhone,
              representativePosition: dto.representativePosition,
              representativeEmail: dto.representativeEmail,
              
              // Social/Contact
              websiteUrl: dto.websiteUrl,
              xAccountUrl: dto.xAccountUrl,
              snapchatAccountUrl: dto.snapchatAccountUrl,
              linkedinAccountUrl: dto.linkedinAccountUrl,
              
              // Existing fields
              licenseNumber: dto.licenseNumber,
              hasWafi: dto.hasWafi,
              acceptsBanks: dto.acceptsBanks,
              description: dto.description,
              location: dto.location,
            },
          },
        },
        include: {
          Developer: true,
        },
      });

      // Upload and create developer documents (required)
      await this.uploadDeveloperDocuments(tx, newUser.id, files);

      // Use auth service to generate tokens
      const tokens = await this.authService.generateTokens(
        newUser.id,
        newUser.phoneNumber,
        Role.DEVELOPER,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
          developer: newUser.Developer,
        },
      };
    });
  }

  /**
   * Upload and create developer documents
   * @param transaction - Prisma transaction
   * @param developerId - Developer user ID
   * @param files - Object with field names as keys and file arrays as values
   */
  private async uploadDeveloperDocuments(
    transaction: any,
    developerId: string,
    files: { [fieldname: string]: Express.Multer.File[] }
  ): Promise<void> {
    const documentTypeMap: { [key: string]: DeveloperDocumentType } = {
      'commercialRegistration': 'commercialRegistration',
      'taxCertificate': 'taxCertificate',
      'valBrokerageLicense': 'valBrokerageLicense',
      'realEstateDevelopmentLicense': 'realEstateDevelopmentLicense',
      'officialCompanyLogo': 'officialCompanyLogo',
    };

    const uploadPromises = Object.entries(files).map(async ([fieldname, fileArray]) => {
      const file = fileArray[0]; // Get the first file from the array
      const documentType = documentTypeMap[fieldname];
      if (!documentType) {
        throw new BadRequestException(`Unknown document type: ${fieldname}`);
      }

      // Upload to S3
      const { url, key } = await this.s3Service.uploadMedia(file, 'developer-documents');
      
      // Create media record
      const media = await transaction.media.create({
        data: {
          url,
          key,
          type: 'document',
          name: file.originalname,
        },
      });

      // Create developer document record
      return transaction.developerDocument.create({
        data: {
          developerId,
          mediaId: media.id,
          documentType,
        },
      });
    });

    await Promise.all(uploadPromises);
  }
} 