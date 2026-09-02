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
