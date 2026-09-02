import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/postgres-client';

@Injectable()
export class PostgresService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/*
 * Raw SQL with Prisma (PostgreSQL / CockroachDB)
 * ------------------------------------------------
 * Prefer the generated model methods (this.prisma.user.findMany(...), etc).
 * Use raw SQL only when you need something Prisma's query builder can't
 * express (window functions, CTEs, vendor-specific syntax, etc).
 *
 * 1) $queryRaw — SELECT, returns typed rows. Use the `Prisma.sql` tagged
 *    template (NOT plain string interpolation) so values are parameterized
 *    and safe from SQL injection.
 *
 *   import { Prisma } from '../../../generated/postgres-client';
 *
 *   const email = 'someone@example.com';
 *   const rows = await this.prisma.$queryRaw<{ id: string; email: string }[]>(
 *     Prisma.sql`SELECT id, email FROM users WHERE email = ${email}`,
 *   );
 *
 * 2) $executeRaw — INSERT/UPDATE/DELETE/DDL, returns the affected row count.
 *
 *   await this.prisma.$executeRaw(
 *     Prisma.sql`UPDATE users SET "isActive" = false WHERE id = ${userId}`,
 *   );
 *
 * 3) $queryRawUnsafe / $executeRawUnsafe — accepts a plain string with `?`
 *    placeholders. Only use this when the query itself must be built
 *    dynamically (e.g. a variable table/column name) — NEVER interpolate
 *    user input directly into the string.
 *
 *   await this.prisma.$queryRawUnsafe(
 *     'SELECT * FROM users WHERE email = $1',
 *     email,
 *   );
 *
 * 4) Multiple statements / raw SQL in a transaction — pass an array of
 *    Prisma.sql calls to $transaction.
 *
 *   await this.prisma.$transaction([
 *     this.prisma.$executeRaw(Prisma.sql`...`),
 *     this.prisma.$executeRaw(Prisma.sql`...`),
 *   ]);
 */
