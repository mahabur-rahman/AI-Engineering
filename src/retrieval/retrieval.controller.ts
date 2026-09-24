import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import type { HybridOptions, HybridResult } from './retrieval.types';

export class HybridSearchRequest {
  query!: string;
  tenantId!: string;
  vectorTopK?: number;
  keywordTopK?: number;
  finalTopK?: number;
  similarityThreshold?: number;
  keywordMinScore?: number;
  rrfK?: number;
  sourceDocumentId?: string;
}

@Controller('retrieval')
export class RetrievalController {
  constructor(private readonly hybrid: HybridRetrievalService) {}

  @Post('hybrid')
  async hybridSearch(@Body() request: HybridSearchRequest): Promise<{
    query: string;
    options: HybridOptions;
    results: HybridResult[];
    totalResults: number;
    noRelevantContext: boolean;
  }> {
    if (!request.query?.trim()) {
      throw new BadRequestException('Query is required');
    }
    if (!request.tenantId?.trim()) {
      throw new BadRequestException('Tenant ID is required');
    }

    const overrides: Partial<HybridOptions> = {
      vectorTopK: request.vectorTopK,
      keywordTopK: request.keywordTopK,
      finalTopK: request.finalTopK,
      similarityThreshold: request.similarityThreshold,
      keywordMinScore: request.keywordMinScore,
      rrfK: request.rrfK,
      filters: request.sourceDocumentId
        ? { sourceDocumentId: request.sourceDocumentId }
        : undefined,
    };

    const options = this.hybrid.resolveOptions(overrides);
    const results = await this.hybrid.search(request.query, request.tenantId, overrides);

    return {
      query: request.query,
      options,
      results,
      totalResults: results.length,
      noRelevantContext: results.length === 0,
    };
  }
}
