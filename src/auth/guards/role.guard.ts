import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/authorize.decorator';
import { UserType } from 'src/common/enums/user-type.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler()],
    );
    if (!requiredRole) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.payload || !user.payload.userType) {
      throw new UnauthorizedException('User Not Authenticated!');
    }
    if (!requiredRole.some((role) => user.payload.userType?.includes(role)))
      throw new UnauthorizedException('Insufficient Privileges');

    return true;
  }
}
