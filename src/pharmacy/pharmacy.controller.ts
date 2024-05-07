import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { AllowedPeriodPipe } from 'src/common/pipes/user-type-validation.pipe';
import { AllowedPeriods } from 'src/common/enums/user-type.enum';

@ApiTags('Pharmacy')
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post()
  create(@Body() createPharmacyDto: CreatePharmacyDto) {
    return this.pharmacyService.create(createPharmacyDto);
  }

  @Get()
  findAll() {
    return this.pharmacyService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePharmacyDto: UpdatePharmacyDto,
  ) {
    return this.pharmacyService.update(+id, updatePharmacyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pharmacyService.remove(+id);
  }

  @Get('/total-count/:period')
  async getTotalStoreCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.pharmacyService.getTotalPharmaciesCount(period);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pharmacyService.findOne(+id);
  }
}
