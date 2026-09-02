import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/mysql-client';

/**
 * Example connection only — not imported into AppModule.
 * Import MysqlModule into a feature module to use it.
 */
@Injectable()
export class MysqlService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MysqlService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to MySQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/*
 * Raw SQL with Prisma (MySQL)
 * ------------------------------------------------
 * Prefer the generated model methods (this.prisma.user.findMany(...), etc).
 * Use raw SQL only when you need something Prisma's query builder can't
 * express.
 *
 * 1) $queryRaw — SELECT, returns typed rows. Use the `Prisma.sql` tagged
 *    template (NOT plain string interpolation) so values are parameterized
 *    and safe from SQL injection.
 *
 *   import { Prisma } from '../../../generated/mysql-client';
 *
 *   const email = 'someone@example.com';
 *   const rows = await this.prisma.$queryRaw<{ id: string; email: string }[]>(
 *     Prisma.sql`SELECT id, email FROM users WHERE email = ${email}`,
 *   );
 *
 * 2) $executeRaw — INSERT/UPDATE/DELETE/DDL, returns the affected row count.
 *
 *   await this.prisma.$executeRaw(
 *     Prisma.sql`UPDATE users SET isActive = false WHERE id = ${userId}`,
 *   );
 *
 * 3) $queryRawUnsafe / $executeRawUnsafe — accepts a plain string with `?`
 *    placeholders. Only use this when the query itself must be built
 *    dynamically (e.g. a variable table/column name) — NEVER interpolate
 *    user input directly into the string.
 *
 *   await this.prisma.$queryRawUnsafe(
 *     'SELECT * FROM users WHERE email = ?',
 *     email,
 *   );
 */
