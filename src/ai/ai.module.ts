import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { VectorModule } from '../vectors/vector.module';
import { RagController } from './rag/rag.controller';
import { RagService } from './rag/rag.service';

@Module({
  imports: [VectorModule],
  providers: [AiService, RagService],
  controllers: [AiController, RagController],
  exports: [AiService],
})
export class AiModule {}
