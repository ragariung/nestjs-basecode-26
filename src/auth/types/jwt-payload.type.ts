import { RoleName } from '../../../generated/postgres-client';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  role: RoleName;
}
