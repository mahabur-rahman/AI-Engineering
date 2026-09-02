import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { smartChunkDocument, validateChunks } from './chunking.util';
import { VectorDbService } from './vector-db.service';

type EmbeddedChunk = {
  content: string;
  embedding: number[];
  pageNumber: number;
  chunkIndex: number;
};

export class IngestDocumentRequest {
  title!: string;
  content!: string;
  source?: string;
}

export class SemanticSearchRequest {
  query!: string;
  topK?: number;
}

@Controller('vectors')
export class VectorController {
  constructor(
    private readonly vectorDb: VectorDbService,
    private readonly embedding: EmbeddingService,
  ) {}

  @Post('ingest')
  async ingestDocument(@Body() request: IngestDocumentRequest) {
    if (!request.title?.trim()) {
      throw new BadRequestException('Title is required');
    }

    if (!request.content?.trim()) {
      throw new BadRequestException('Content is required');
    }

    const chunks = smartChunkDocument(request.content);
    const validation = validateChunks(chunks);

    if (chunks.length === 0) {
      throw new BadRequestException('Document content is too small to chunk');
    }

    if (!validation.isValid) {
      console.warn('Chunking warnings:', validation.issues);
    }

    try {
      const chunksWithEmbeddings: EmbeddedChunk[] = [];
      for (const chunk of chunks) {
        const result = await this.embedding.generateEmbedding({
          text: chunk.content,
        });
        chunksWithEmbeddings.push({
          content: chunk.content,
          embedding: result.embedding,
          pageNumber: chunk.index + 1,
          chunkIndex: chunk.index,
        });
      }

      const documentId = await this.vectorDb.storeDocument({
        title: request.title,
        source: request.source,
        chunks: chunksWithEmbeddings,
      });

      return {
        documentId,
        chunkCount: chunks.length,
        message: `Document ingested successfully with ${chunks.length} chunks`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to ingest document: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('search')
  async semanticSearch(@Body() request: SemanticSearchRequest) {
    if (!request.query?.trim()) {
      throw new BadRequestException('Query is required');
    }

    const topK = request.topK ?? 5;
    if (!Number.isInteger(topK) || topK <= 0 || topK > 100) {
      throw new BadRequestException(
        'topK must be an integer between 1 and 100',
      );
    }

    try {
      const results = await this.vectorDb.semanticSearch(request.query, topK);
      return {
        query: request.query,
        results,
        totalResults: results.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get('health')
  async healthCheck() {
    const [ollamaRunning, stats] = await Promise.all([
      this.embedding.checkHealth(),
      this.vectorDb.getStats(),
    ]);

    return {
      ollamaRunning,
      ...stats,
      status: ollamaRunning ? 'healthy' : 'unhealthy',
    };
  }

  @Get('models')
  async getAvailableModels() {
    return {
      availableEmbeddingModels: await this.embedding.getAvailableModels(),
      currentModel: 'nomic-embed-text',
    };
  }

  @Get('stats')
  async getStats() {
    return this.vectorDb.getStats();
  }
}
