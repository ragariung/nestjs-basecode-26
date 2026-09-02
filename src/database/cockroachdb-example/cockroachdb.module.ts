import { Module } from '@nestjs/common';
import { CockroachdbService } from './cockroachdb.service';

@Module({
  providers: [CockroachdbService],
  exports: [CockroachdbService],
})
export class CockroachdbModule {}
