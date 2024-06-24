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
import { AllowedPeriods } from '../enums/user-type.enum';

export class CalculationsHelper {
  /**
   * Determines the start and end dates for the specified period (day, week, month, or year).
   * @param period - The allowed period (either "day", "week", "month", or "year").
   * currentPeriod : [thisDay ,thisWeek, thisMonth, thisYear]
   * previousPeriod : [yasterDay ,lastWeek, lastMonth, lastYear]
   * @returns An object containing the start and end dates for the current and previous periods.
   */
  static calculateDateRanges(period: AllowedPeriods): {
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

  /**
   * Calculates the percentage change between the current and previous counts of [active products, Pharmacies, Stores..].
   *
   * @param currentCount - The count of [active products, Pharmacies, Stores..] in the current period.
   * @param previousCount - The count of [active products, Pharmacies, Stores..] in the previous period.
   *
   * @returns The percentage change between the current and previous counts.
   */
  static calculatePercentageChange(
    currentCount: number,
    previousCount: number,
  ): number {
    console.log(currentCount, previousCount);
    if (currentCount == 0 && previousCount === 0) {
      return 0;
    } else if (previousCount == 0 && currentCount > 0) {
      return 100;
    } else if (currentCount == 0 && previousCount > 0) {
      return -100;
    } else if (currentCount !== 0 && previousCount !== 0) {
      return ((currentCount - previousCount) / previousCount) * 100;
    }
  }
} 
