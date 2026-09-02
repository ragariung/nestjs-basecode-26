import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/cockroachdb-client';

/**
 * Example connection only — not imported into AppModule.
 * Import CockroachdbModule into a feature module to use it.
 */
@Injectable()
export class CockroachdbService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CockroachdbService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to CockroachDB');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
