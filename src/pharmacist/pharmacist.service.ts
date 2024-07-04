import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePharmacistDto } from './dto/create-pharmacist.dto';
import { UpdatePharmacistDto } from './dto/update-pharmacist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pharmacist } from './entities/pharmacist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PharmacistService {
  constructor(
    @InjectRepository(Pharmacist)
    private readonly pharmacistRepo: Repository<Pharmacist>,
  ) {}

  async create(createPharmacistDto: CreatePharmacistDto) {
    const existingPharmacist = await this.findByLicenseNumber(
      createPharmacistDto.licenseNumber,
    );

    if (!existingPharmacist && this.isDtoDataUndefined(createPharmacistDto)) {
      throw new NotFoundException('Pharmacist does not have an account');
    }

    let pharmacist;

    if (existingPharmacist) {
      pharmacist = existingPharmacist;
    } else {
      // If pharmacist does not exist, create a new one
      pharmacist = this.pharmacistRepo.create({
        ...createPharmacistDto,
     
      });
    }

    return await this.pharmacistRepo.save(pharmacist);
  }

  findAll() {
    return `This action returns all pharmacist`;
  }

  async findOne(licenseNumber: string) {
     const pharmacist= await this.pharmacistRepo.findOne({ where: { licenseNumber } ,relations:['pharmacies']});

    return pharmacist;

  }

  async findByLicenseNumber(licenseNumber: string) {
    return await this.pharmacistRepo.findOne({ where: { licenseNumber } });
  }

  update(id: number, updatePharmacistDto: UpdatePharmacistDto) {
    return `This action updates a #${id} pharmacist`;
  }

  remove(id: number) {
    return `This action removes a #${id} pharmacist`;
  }

  private isDtoDataUndefined(dto: CreatePharmacistDto): boolean {
    const { licenseNumber, ...restOfData } = dto;
    return Object.values(restOfData).every((value) => value === undefined);
  }
}
