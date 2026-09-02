import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, RoleName } from '../../generated/postgres-client';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PostgresService } from '../database/postgres/postgres.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, tenantId: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PostgresService) {}

  async create(currentUser: JwtPayload, dto: CreateUserDto) {
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    this.assertTenantAccess(currentUser, role.tenantId);
    if (role.name === RoleName.SUPER_ADMIN && currentUser.role !== RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('Only a SUPER_ADMIN can assign the SUPER_ADMIN role');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          roleId: dto.roleId,
          isActive: dto.isActive ?? true,
        },
        select: SAFE_USER_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with that email already exists');
      }
      throw error;
    }
  }

  findAll(currentUser: JwtPayload) {
    const where =
      currentUser.role === RoleName.SUPER_ADMIN ? {} : { role: { tenantId: currentUser.tenantId } };
    return this.prisma.user.findMany({ where, select: SAFE_USER_SELECT, orderBy: { createdAt: 'asc' } });
  }

  async findOne(currentUser: JwtPayload, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertTenantAccess(currentUser, user.role.tenantId);
    return user;
  }

  async update(currentUser: JwtPayload, id: string, dto: UpdateUserDto) {
    await this.findOne(currentUser, id);

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      this.assertTenantAccess(currentUser, role.tenantId);
      if (role.name === RoleName.SUPER_ADMIN && currentUser.role !== RoleName.SUPER_ADMIN) {
        throw new ForbiddenException('Only a SUPER_ADMIN can assign the SUPER_ADMIN role');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          email: dto.email,
          name: dto.name,
          roleId: dto.roleId,
          isActive: dto.isActive,
          password: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
        },
        select: SAFE_USER_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with that email already exists');
      }
      throw error;
    }
  }

  async remove(currentUser: JwtPayload, id: string) {
    await this.findOne(currentUser, id);
    await this.prisma.user.delete({ where: { id } });
  }

  private assertTenantAccess(currentUser: JwtPayload, tenantId: string | null): void {
    if (currentUser.role === RoleName.SUPER_ADMIN) {
      return;
    }
    if (tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('You cannot access users outside your tenant');
    }
  }
}
