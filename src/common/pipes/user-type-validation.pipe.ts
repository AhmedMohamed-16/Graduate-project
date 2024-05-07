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
