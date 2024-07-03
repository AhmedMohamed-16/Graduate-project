import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApiTags } from '@nestjs/swagger';

import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';
import {
  AllowedPeriodPipe,
  IsBooleanPipes,
} from 'src/common/pipes/user-type-validation.pipe';
import { Store } from './entities/store.entity';

@ApiTags('Store')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  async create(@Body() createStoreDto: CreateStoreDto) {
    return await this.storeService.create(createStoreDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.storeService.findOne(+id);
  }

  @Get(':name?')
  async findAll(@Query('name') name?: string) {
    return await this.storeService.findStoresByName(name);
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
  async getTotalStoresCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.storeService.getTotalStoresCount(period);
  }

  @Get('/top-selling-stores/:isTop')
  async getTopOrBottomStores(
    @Param('isTop', IsBooleanPipes) isTop: IsBooleanPipes,
  ): Promise<Store[]> {
    return await this.storeService.getTopOrBottomStores(isTop);
  }
}
