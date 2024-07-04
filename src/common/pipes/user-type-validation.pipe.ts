import {
  ArgumentMetadata,
  BadRequestException,
  NotFoundException,
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
  transform(value: any): {
    startRange?: number;
    endRange?: number;
    categoryId?: number;
  } {
    const startRange =
      value.startRange !== undefined ? parseFloat(value.startRange) : undefined;
    const endRange =
      value.endRange !== undefined ? parseFloat(value.endRange) : undefined;
    const categoryId =
      value.categoryId !== undefined
        ? parseInt(value.categoryId, 10)
        : undefined;

    // Handle case where either 'startRange' or 'endRange' is provided without the other
    if (
      (startRange === undefined && endRange !== undefined) ||
      (startRange !== undefined && endRange === undefined)
    ) {
      throw new BadRequestException(
        'Both "startRange" and "endRange" values must be provided together.',
      );
    }

    // Handle case where 'startRange' or 'endRange' is not a valid number
    if (
      (startRange !== undefined && isNaN(startRange)) ||
      (endRange !== undefined && isNaN(endRange))
    ) {
      throw new BadRequestException(
        'Invalid price range. Please provide valid numeric values.',
      );
    }

    // Handle case where 'startRange' is greater than 'endRange'
    if (
      startRange !== undefined &&
      endRange !== undefined &&
      startRange > endRange
    ) {
      throw new BadRequestException(
        'Invalid price range. "startRange" should be less than or equal to "endRange".',
      );
    }

    // Handle case where 'categoryId' is not a valid number
    if (categoryId !== undefined && isNaN(categoryId)) {
      throw new BadRequestException(
        'Invalid category ID. Please provide a valid number.',
      );
    }

    return { startRange, endRange, categoryId };
  }
}

export class ProductInventoryFilerPip implements PipeTransform {
  transform(value: any): {
    miniOffer: number;
    maxOffer: number;
    productId: number;
  } {
    const productId = value.productId;
    const miniOffer =
      value.miniOffer !== undefined ? value.miniOffer : undefined;
    const maxOffer = value.maxOffer !== undefined ? value.maxOffer : undefined;

    if (
      (miniOffer === undefined && maxOffer !== undefined) ||
      (miniOffer !== undefined && maxOffer === undefined)
    ) {
      throw new BadRequestException(
        'Both "miniOffer" and "maxOffer" values must be provided together.',
      );
    }

    if (
      miniOffer !== undefined &&
      maxOffer !== undefined &&
      miniOffer > maxOffer
    ) {
      throw new BadRequestException(
        'Invalid price range. "miniOffer" should be less than or equal to "maxOffer".',
      );
    }

    if (productId === undefined) {
      throw new NotFoundException('productId is Should be provided');
    }
    return { miniOffer, maxOffer, productId };
  }
}

export class ParseBoolPipe implements PipeTransform {
  transform(value: any) {
    if (value === 'true' || value === true) {
      return true;
    } else if (value === 'false' || value === false) {
      return false;
    } else {
      throw new BadRequestException(`Invalid boolean value: ${value}`);
    }
  }
}
