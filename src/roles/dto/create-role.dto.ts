import { IsIn, IsOptional, IsString } from 'class-validator';
import { RoleName } from '../../../generated/postgres-client';

/** SUPER_ADMIN is a seed-only, single global role — never creatable via the API. */
export const ASSIGNABLE_ROLE_NAMES = [RoleName.ADMIN, RoleName.MANAGER, RoleName.SPV, RoleName.USER];

export class CreateRoleDto {
  @IsIn(ASSIGNABLE_ROLE_NAMES)
  name: RoleName;

  /** Required for SUPER_ADMIN callers; ignored for ADMIN callers (forced to their own tenant). */
  @IsOptional()
  @IsString()
  tenantId?: string;
}
