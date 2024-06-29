import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { UserType } from '../enums/user-type.enum';
import { AllowedPeriods } from '../enums/allowed-periods.enum';

export class UserTypeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!Object.values(UserType).includes(value)) {
      throw new BadRequestException(`"${value}" Is an Invalid User Type!`);
    }
    return value;
  }
}

export class AllowedPeriodPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (!Object.values(AllowedPeriods).includes(value)) {
      throw new BadRequestException(`${value}: Is an Invalid Period!`);
    }
    return value;
  }
}

export class IsBooleanPipes implements PipeTransform {
  transform(value: any): boolean {
    const parsedValue = String(value).toLowerCase(); // Convert to lowercase for case-insensitivity

    if (parsedValue === 'true' || parsedValue === 'false') {
      return parsedValue === 'true';
    } else {
      throw new BadRequestException('Invalid boolean value');
    }
  }
}

export class ProductFilterPipe implements PipeTransform {
  transform(value: any): { from?: number; to?: number; categoryId?: number } {
    const from = value.from !== undefined ? parseFloat(value.from) : undefined;
    const to = value.to !== undefined ? parseFloat(value.to) : undefined;
    const categoryId =
      value.categoryId !== undefined
        ? parseInt(value.categoryId, 10)
        : undefined;

    // Handle case where either 'from' or 'to' is provided without the other
    if (
      (from === undefined && to !== undefined) ||
      (from !== undefined && to === undefined)
    ) {
      throw new BadRequestException(
        'Both "from" and "to" values must be provided together.',
      );
    }

    // Handle case where 'from' or 'to' is not a valid number
    if (
      (from !== undefined && isNaN(from)) ||
      (to !== undefined && isNaN(to))
    ) {
      throw new BadRequestException(
        'Invalid price range. Please provide valid numeric values.',
      );
    }

    // Handle case where 'from' is greater than 'to'
    if (from !== undefined && to !== undefined && from > to) {
      throw new BadRequestException(
        'Invalid price range. "from" should be less than or equal to "to".',
      );
    }

    // Handle case where 'categoryId' is not a valid number
    if (categoryId !== undefined && isNaN(categoryId)) {
      throw new BadRequestException(
        'Invalid category ID. Please provide a valid number.',
      );
    }

    return { from, to, categoryId };
  }
}
