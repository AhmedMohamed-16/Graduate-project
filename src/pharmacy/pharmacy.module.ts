import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { PharmacistModule } from 'src/pharmacist/pharmacist.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy]), PharmacistModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
