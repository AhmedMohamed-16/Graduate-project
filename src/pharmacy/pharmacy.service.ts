import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { Between, Repository } from 'typeorm';
import { PharmacistService } from 'src/pharmacist/pharmacist.service';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
  subMonths,
  subWeeks,
  addDays,
} from 'date-fns';
import { AllowedPeriods } from 'src/common/enums/user-type.enum';

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
      // createdAt: new Date()
    });

    const newPharmacy = this.pharmacyRepo.create({
      ...createPharmacyDto,
      createdAt: new Date(),
      pharmacist,
    });

    return await this.pharmacyRepo.save(newPharmacy);
  }

  findAll() {
    return `This action returns all pharmacy`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pharmacy`;
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

  /**
   * Calculates the total Pharmacies count based on the specified period.
   * If the period is "all-time," returns the overall store count.
   * Otherwise, computes the Pharmacies count within the specified date range.
   * Calculates the percentage change between the current and previous Pharmacies counts.
   */
  async getTotalPharmaciesCount(
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const totalCount = await this.pharmacyRepo.count();
      return { count: totalCount, percentageChange: 0 };
    }

    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = this.calculateDateRanges(period);

    try {
      const [pharmaciesCount, previousPharmaciesCount] = await Promise.all([
        this.pharmacyRepo.count({
          where: { createdAt: Between(currentStartDate, currentEndDate) },
        }),
        this.pharmacyRepo.count({
          where: { createdAt: Between(previousStartDate, previousEndDate) },
        }),
      ]);

      let percentageChange: number;

      if (
        (pharmaciesCount == 0 && previousPharmaciesCount === 0) ||
        previousPharmaciesCount == pharmaciesCount
      ) {
        percentageChange = 0;
      } else if (
        pharmaciesCount > previousPharmaciesCount &&
        previousPharmaciesCount == 0
      ) {
        percentageChange = pharmaciesCount * +100;
      } else if (
        previousPharmaciesCount > pharmaciesCount &&
        pharmaciesCount == 0
      ) {
        percentageChange = previousPharmaciesCount * -100;
      } else {
        percentageChange =
          ((pharmaciesCount - previousPharmaciesCount) /
            previousPharmaciesCount) *
          100;
      }

      return { count: pharmaciesCount, percentageChange };
    } catch (error) {
      console.error('An error occurred while counting the stores:', error);
    }
  }

  /**
   * Determines the start and end dates for the specified period (day, week, month, or year).
   */
  calculateDateRanges(period: AllowedPeriods): {
    currentStartDate: Date;
    currentEndDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    let currentStartDate: Date,
      currentEndDate: Date,
      previousStartDate: Date,
      previousEndDate: Date;

    switch (period) {
      case AllowedPeriods.DAY:
        currentStartDate = startOfDay(new Date());
        currentEndDate = endOfDay(new Date());
        previousStartDate = startOfDay(addDays(new Date(), -1)); // Previous day
        previousEndDate = endOfDay(addDays(new Date(), -1));
        break;
      case AllowedPeriods.WEEK:
        currentStartDate = startOfWeek(new Date(), { weekStartsOn: 6 });
        currentEndDate = endOfWeek(new Date(), { weekStartsOn: 6 });
        previousStartDate = startOfWeek(subWeeks(new Date(), 1), {
          weekStartsOn: 6,
        }); // Previous week
        previousEndDate = endOfWeek(subWeeks(new Date(), 1), {
          weekStartsOn: 6,
        });
        break;
      case AllowedPeriods.MONTH:
        currentStartDate = startOfMonth(new Date());
        currentEndDate = endOfMonth(new Date());
        previousStartDate = startOfMonth(subMonths(new Date(), 1)); // Previous month
        previousEndDate = endOfMonth(subMonths(new Date(), 1));
        break;
      case AllowedPeriods.YEAR:
        currentStartDate = startOfYear(new Date());
        currentEndDate = endOfYear(new Date());
        previousStartDate = startOfYear(subYears(new Date(), 1)); // Previous year
        previousEndDate = endOfYear(subYears(new Date(), 1));
        break;
      case AllowedPeriods.ALLTIME:
    }
    return {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    };
  }
}
