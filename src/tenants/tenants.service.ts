import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleName } from '../../generated/postgres-client';
import { PostgresService } from '../database/postgres/postgres.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

const TENANT_SCOPED_ROLES = [RoleName.ADMIN, RoleName.MANAGER, RoleName.SPV, RoleName.USER];

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PostgresService) {}

  async create(dto: CreateTenantDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({ data: dto });
        await tx.role.createMany({
          data: TENANT_SCOPED_ROLES.map((name) => ({ name, tenantId: tenant.id })),
        });
        return tenant;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A tenant with that slug already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    try {
      return await this.prisma.tenant.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A tenant with that slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.tenant.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Cannot delete a tenant that still has users assigned to it');
      }
      throw error;
    }
  }
}
