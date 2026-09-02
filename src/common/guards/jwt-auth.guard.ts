import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

/**
 * On top of standard JWT verification, reissues a fresh token (same claims,
 * renewed expiry) on every successful authenticated request and returns it
 * via the `x-refreshed-token` response header — a sliding session: as long
 * as the client is active before the token expires and swaps in the
 * refreshed token, it never gets logged out.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = (await super.canActivate(context)) as boolean;
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user as JwtPayload;

    const refreshedToken = this.jwtService.sign(
      {
        sub: user.sub,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
      { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d') as JwtSignOptions['expiresIn'] },
    );
    response.setHeader('x-refreshed-token', refreshedToken);

    return true;
  }
}
