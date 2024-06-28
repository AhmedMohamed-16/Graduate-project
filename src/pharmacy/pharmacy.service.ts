import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { InjectRepository ,} from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { Between, Repository ,In} from 'typeorm';
import { PharmacistService } from 'src/pharmacist/pharmacist.service';
import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';
import { CalculationsHelper } from 'src/common/helpers/calculations.helper';
 


@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
    private readonly pharmacistService: PharmacistService, 
   
    // Inject the PharmacistService
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

  async findAll() {
    return  await this.pharmacyRepo.find();
  }

  findOne(id: number) { 
    return this.pharmacyRepo.findOneBy({ id }) 
  }
  findMany(ids: number[]) {
    return this.pharmacyRepo.findBy({ id: In(ids) });
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



async getTotalPharmaciesCount(
  period: AllowedPeriods,
): Promise<{ count: number; percentageChange: number }> {
  if (period === AllowedPeriods.ALLTIME) {
    const totalCount = await this.pharmacyRepo.count({});
    return { count: totalCount, percentageChange: 0 };
  }

  // Calculate the start and end dates for the current and previous periods
  const {
    currentStartDate,
    currentEndDate,
    previousStartDate,
    previousEndDate,
  } = CalculationsHelper.calculateDateRanges(period);
  try {
    const [currentCount, previousCount] = await Promise.all([
      this.pharmacyRepo.count({
        where: { createdAt: Between(currentStartDate, currentEndDate) },
      }),
      this.pharmacyRepo.count({
        where: { createdAt: Between(previousStartDate, previousEndDate) },
      }),
    ]);

    // Calculate the percentage change between the current and previous counts
    const percentageChange: number =
      CalculationsHelper.calculatePercentageChange(
        currentCount,
        previousCount,
      );
    return { count: currentCount, percentageChange };
  } catch (error) {
    console.error('An error occurred while counting the orders:', error);
  }
}

// find pharmacies that are top buying


}
