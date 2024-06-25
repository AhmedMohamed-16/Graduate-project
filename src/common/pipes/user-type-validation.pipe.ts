 
import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { AllowedPeriods, UserType } from '../enums/user-type.enum';

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
