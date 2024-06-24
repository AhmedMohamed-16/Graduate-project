import { Module } from '@nestjs/common';
import { PharmacistService } from './pharmacist.service';
import { PharmacistController } from './pharmacist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pharmacist } from './entities/pharmacist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacist])],
  controllers: [PharmacistController],
  providers: [PharmacistService],
  exports: [PharmacistService],
})
export class PharmacistModule {}
