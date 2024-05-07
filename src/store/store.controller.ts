import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApiTags } from '@nestjs/swagger';
import { AllowedPeriods } from 'src/common/enums/user-type.enum';
import { AllowedPeriodPipe } from 'src/common/pipes/user-type-validation.pipe';

@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  async create(@Body() createStoreDto: CreateStoreDto) {
    return await this.storeService.create(createStoreDto);
  }

  @Get()
  findAll() {
    return this.storeService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(+id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeService.remove(+id);
  }

  @Get('/total-count/:period')
  async getTotalStoreCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.storeService.getTotalStoreCount(period);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.storeService.findById(+id);
  }
}
