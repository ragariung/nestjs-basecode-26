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
