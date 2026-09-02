import { IsIn } from 'class-validator';
import { RoleName } from '../../../generated/postgres-client';
import { ASSIGNABLE_ROLE_NAMES } from './create-role.dto';

export class UpdateRoleDto {
  @IsIn(ASSIGNABLE_ROLE_NAMES)
  name: RoleName;
}
