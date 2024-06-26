import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { Repository } from 'typeorm';
import { PharmacistService } from 'src/pharmacist/pharmacist.service';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
    private readonly pharmacistService: PharmacistService, // Inject the PharmacistService
  ) {}

  async create(createPharmacyDto: CreatePharmacyDto): Promise<Pharmacy> {
    const existingPharmacy = await this.findByUserName(
      createPharmacyDto.userName,
    );
    if (existingPharmacy) {
      throw new ConflictException('Invalid Username');
    }

    const pharmacist = await this.pharmacistService.create({
 
      ...createPharmacyDto.pharmacist,
    }); 

    const newPharmacy = this.pharmacyRepo.create({
      ...createPharmacyDto,
      
      pharmacist,
    });

    return await this.pharmacyRepo.save(newPharmacy);
  }

  findAll() {
    return `This action returns all pharmacy`;
  }

  findOne(id: number) { 
    return this.pharmacyRepo.findOneBy({ id }) 
  }

  async findByUserName(userName: string): Promise<Pharmacy | undefined> {
    return await this.pharmacyRepo.findOne({ where: { userName } });
  }

  update(id: number, updatePharmacyDto: UpdatePharmacyDto) {
    return `This action updates a #${id} pharmacy`;
  }

  remove(id: number) {
    return `This action removes a #${id} pharmacy`;
  } 

  async getOrdersByID(id:number) {
    const user = await this.pharmacyRepo.findOne( { where: { id},relations:['order', 'order.orderDetail','order.orderDetail.productInventory']}) ;
    
    return user ; 
} 
}
