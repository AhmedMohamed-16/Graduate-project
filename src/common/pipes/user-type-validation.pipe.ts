import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { UserType } from '../enums/user-type.enum';

export class UserTypeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!this.isValidUserType(value)) {
      throw new BadRequestException(`"${value}" is an invalid user type`);
    }
    return value;
  }

  isValidUserType(userTypes: UserType): boolean {
    const enumValue = Object.values(UserType);
    return enumValue.includes(userTypes);
  }
}
