import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserTypeValidationPipe } from 'src/common/pipes/user-type-validation.pipe';

@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { userName, password, userType } = request.body;

    if (!userName || !password || !userType) {
      throw new UnauthorizedException('Missing credentials');
    }

    const validatedUserType = await new UserTypeValidationPipe().transform(
      userType,
      { type: 'body' },
    );

    const user = await this.authService.validateUser(
      userName,
      password,
      validatedUserType,
    );
    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;

    return true;
  }
}
