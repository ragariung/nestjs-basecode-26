import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleName } from '../../generated/postgres-client';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PostgresService } from '../database/postgres/postgres.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PostgresService) {}

  async create(currentUser: JwtPayload, dto: CreateRoleDto) {
    const tenantId = this.resolveTargetTenantId(currentUser, dto.tenantId);
    try {
      return await this.prisma.role.create({ data: { name: dto.name, tenantId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That role already exists for this tenant');
      }
      throw error;
    }
  }

  findAll(currentUser: JwtPayload) {
    const where = currentUser.role === RoleName.SUPER_ADMIN ? {} : { tenantId: currentUser.tenantId };
    return this.prisma.role.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  async findOne(currentUser: JwtPayload, id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    this.assertTenantAccess(currentUser, role.tenantId);
    return role;
  }

  async update(currentUser: JwtPayload, id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(currentUser, id);
    if (role.name === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN role cannot be modified');
    }
    try {
      return await this.prisma.role.update({ where: { id }, data: { name: dto.name } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That role already exists for this tenant');
      }
      throw error;
    }
  }

  async remove(currentUser: JwtPayload, id: string) {
    const role = await this.findOne(currentUser, id);
    if (role.name === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN role cannot be deleted');
    }
    try {
      await this.prisma.role.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Cannot delete a role that still has users assigned to it');
      }
      throw error;
    }
  }

  private resolveTargetTenantId(currentUser: JwtPayload, requestedTenantId?: string): string {
    if (currentUser.role === RoleName.SUPER_ADMIN) {
      if (!requestedTenantId) {
        throw new ForbiddenException('tenantId is required when creating a role as SUPER_ADMIN');
      }
      return requestedTenantId;
    }
    return currentUser.tenantId as string;
  }

  private assertTenantAccess(currentUser: JwtPayload, tenantId: string | null): void {
    if (currentUser.role === RoleName.SUPER_ADMIN) {
      return;
    }
    if (tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('You cannot access roles outside your tenant');
    }
  }
}
