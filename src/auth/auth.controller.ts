import { ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserType } from 'src/common/enums/user-type.enum';
import { CreateStoreDto } from 'src/store/dto/create-store.dto';
import { CreatePharmacyDto } from 'src/pharmacy/dto/create-pharmacy.dto';
import { CreateAdminDto } from 'src/admin/dto/create-admin.dto';
import { LoginDto } from './dtos/login.dto';
import {
  FileFieldsInterceptor,
  NoFilesInterceptor,
} from '@nestjs/platform-express/multer';
import { UploadService } from 'src/upload/upload.service';
import { RefreshJwtAuthGuard } from './guards/resresh-jwt-auth.guard';
import { Admin } from 'src/admin/entities/admin.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return await this.authService.login(req.user, loginDto.userType);
  }

  @Post('register/admin')
  @UseInterceptors(NoFilesInterceptor())
  async registerAdmin(@Body() createUserDto: CreateAdminDto) {
    return await this.authService.register(createUserDto, UserType.ADMIN);
  }

  @Post('register/store')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'taxLicense', maxCount: 1 },
      { name: 'taxCard', maxCount: 1 },
      { name: 'commercialRegister', maxCount: 1 },
    ]),
  )
  @UsePipes(new ValidationPipe())
  async registerStore(
    @UploadedFiles()
    files: {
      taxLicense: Express.Multer.File[];
      taxCard: Express.Multer.File[];
      commercialRegister: Express.Multer.File[];
    },
    @Body() createStoreDto: CreateStoreDto,
  ) {
    if (!files.taxLicense || !files.taxCard || !files.commercialRegister) {
      throw new BadRequestException(
        'Please provide taxLicense,taxCard,and commercialRegister as files.',
      );
    }

    createStoreDto.taxLicense = await this.uploadService.storeFile(
      files.taxLicense[0],
    );
    createStoreDto.taxCard = await this.uploadService.storeFile(
      files.taxCard[0],
    );
    createStoreDto.commercialRegister = await this.uploadService.storeFile(
      files.commercialRegister[0],
    );

    return await this.authService.register(createStoreDto, UserType.STORE);
  }

  @Post('register/pharmacy')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'commercialRegister', maxCount: 1 },
      { name: 'pharmacyPhoto', maxCount: 1 },
    ]),
  )
  async registerPharmacy(
    @UploadedFiles()
    files: {
      commercialRegister: Express.Multer.File[];
      pharmacyPhoto: Express.Multer.File[];
    },
    @Body() createPharmacyDto: CreatePharmacyDto,
  ) {
    if (!files.commercialRegister || !files.pharmacyPhoto) {
      throw new BadRequestException(
        'Please provide both commercial register and pharmacy photo as files.',
      );
    }

    createPharmacyDto.commercialRegister = await this.uploadService.storeFile(
      files.commercialRegister[0],
    );
    createPharmacyDto.pharmacyPhoto = await this.uploadService.storeFile(
      files.pharmacyPhoto[0],
    );

    return await this.authService.register(
      createPharmacyDto,
      UserType.PHARMACY,
    );
  }

  @Post('refresh')
  @UseGuards(RefreshJwtAuthGuard)
  async refresh(@Request() req): Promise<{ accessToken: string }> {
    return await this.authService.refreshToken(req.user);
  }
}
