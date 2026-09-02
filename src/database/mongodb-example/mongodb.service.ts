import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/mongodb-client';

/**
 * Example connection only — not imported into AppModule.
 * Import MongodbModule into a feature module to use it.
 */
@Injectable()
export class MongodbService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongodbService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to MongoDB');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/*
 * Raw queries with Prisma (MongoDB)
 * ------------------------------------------------
 * MongoDB has no SQL, so there's no $queryRaw/$executeRaw here — Prisma
 * exposes the raw MongoDB command/aggregation protocol instead. Prefer the
 * generated model methods (this.prisma.user.findMany(...), etc) and only
 * drop to raw when you need an operator Prisma's query builder doesn't
 * expose.
 *
 * 1) $runCommandRaw — send any raw MongoDB database command.
 *
 *   const result = await this.prisma.$runCommandRaw({
 *     find: 'users',
 *     filter: { email: 'someone@example.com' },
 *   });
 *
 * 2) Raw aggregation pipeline via $runCommandRaw.
 *
 *   const result = await this.prisma.$runCommandRaw({
 *     aggregate: 'users',
 *     pipeline: [
 *       { $match: { isActive: true } },
 *       { $group: { _id: '$roleId', count: { $sum: 1 } } },
 *     ],
 *     cursor: {},
 *   });
 *
 * 3) A model's own .aggregateRaw() / .findRaw() shortcuts (equivalent to
 *    the above, scoped to one collection):
 *
 *   const result = await this.prisma.user.findRaw({
 *     filter: { email: 'someone@example.com' },
 *   });
 *
 * Note: $runCommandRaw/aggregateRaw output is untyped (JsonObject) — cast
 * or validate the shape yourself before using it.
 */
