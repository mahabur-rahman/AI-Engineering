import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { VectorModule } from '../vectors/vector.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { Reranker } from './reranking/reranker.types';
import { LlmRerankerService } from './reranking/llm-reranker.service';
import { RagController } from './rag/rag.controller';
import { RagService } from './rag/rag.service';
import { MultiQueryService } from './rag/multi-query.service';

@Module({
  imports: [VectorModule, RetrievalModule],
  providers: [
    AiService,
    RagService,
    MultiQueryService,
    { provide: Reranker, useClass: LlmRerankerService },
  ],
  controllers: [AiController, RagController],
  exports: [AiService],
})
export class AiModule {}
