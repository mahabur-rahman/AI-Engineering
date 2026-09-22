import { Module } from '@nestjs/common';
import { VectorModule } from '../vectors/vector.module';
import { KeywordRetrievalService } from './keyword-retrieval.service';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import { RetrievalController } from './retrieval.controller';

@Module({
  imports: [VectorModule],
  controllers: [RetrievalController],
  providers: [KeywordRetrievalService, HybridRetrievalService],
  exports: [KeywordRetrievalService, HybridRetrievalService],
})
export class RetrievalModule {}
