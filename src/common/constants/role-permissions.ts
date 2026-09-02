import { RoleName } from '../../../generated/postgres-client';
import { Permission } from '../enums/permission.enum';

/**
 * Permission sets are intentionally explicit per role rather than a strict
 * numeric hierarchy: SPV can approve/review but not write, while USER can
 * write but not approve — so higher roles do not automatically inherit
 * every lower role's permissions.
 */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.SUPER_ADMIN]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.APPROVE,
    Permission.DELETE,
    Permission.MANAGE_TENANTS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_USERS,
  ],
  [RoleName.ADMIN]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.APPROVE,
    Permission.DELETE,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_USERS,
  ],
  [RoleName.MANAGER]: [Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.APPROVE],
  [RoleName.SPV]: [Permission.READ, Permission.APPROVE],
  [RoleName.USER]: [Permission.CREATE],
};
