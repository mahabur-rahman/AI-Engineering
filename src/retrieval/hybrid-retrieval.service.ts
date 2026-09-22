// Week 3 Day 2 - Hybrid retrieval orchestration (retrieval only, no LLM).
// vector (dense) + keyword (lexical/sparse) -> RRF fusion -> dedupe by chunk id -> final Top-K.

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { VectorDbService } from '../vectors/vector-db.service';
import type { SearchResult } from '../vectors/vector-db.service';
import { KeywordRetrievalService } from './keyword-retrieval.service';
import { reciprocalRankFusion } from './fusion';
import {
  DEFAULT_HYBRID_OPTIONS,
  type HybridOptions,
  type HybridResult,
  type KeywordResult,
} from './retrieval.types';

@Injectable()
export class HybridRetrievalService {
  private readonly logger = new Logger(HybridRetrievalService.name);

  constructor(
    private readonly vectorDb: VectorDbService,
    private readonly keywordRetrieval: KeywordRetrievalService,
  ) {}

  resolveOptions(overrides: Partial<HybridOptions> = {}): HybridOptions {
    const defined = Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => value !== undefined),
    ) as Partial<HybridOptions>;
    const options = { ...DEFAULT_HYBRID_OPTIONS, ...defined };

    for (const key of ['vectorTopK', 'keywordTopK', 'finalTopK'] as const) {
      if (!Number.isInteger(options[key]) || options[key] < 1 || options[key] > 100) {
        throw new BadRequestException(`${key} must be an integer between 1 and 100`);
      }
    }
    if (
      !Number.isFinite(options.similarityThreshold) ||
      options.similarityThreshold < 0 ||
      options.similarityThreshold > 1
    ) {
      throw new BadRequestException('similarityThreshold must be between 0 and 1');
    }
    if (!Number.isFinite(options.keywordMinScore) || options.keywordMinScore < 0) {
      throw new BadRequestException('keywordMinScore must be >= 0');
    }
    if (!Number.isFinite(options.rrfK) || options.rrfK < 1) {
      throw new BadRequestException('rrfK must be >= 1');
    }
    return options;
  }

  async search(
    query: string,
    tenantId: string,
    overrides: Partial<HybridOptions> = {},
  ): Promise<HybridResult[]> {
    if (!query?.trim()) {
      throw new BadRequestException('Query cannot be empty');
    }
    if (!tenantId?.trim()) {
      throw new BadRequestException('Tenant ID cannot be empty');
    }
    const options = this.resolveOptions(overrides);

    const [vectorOutcome, keywordOutcome] = await Promise.allSettled([
      this.vectorDb.semanticSearch(
        query,
        tenantId,
        options.vectorTopK,
        options.similarityThreshold,
        options.filters,
      ),
      this.keywordRetrieval.search(
        query,
        tenantId,
        options.keywordTopK,
        options.keywordMinScore,
        options.filters,
      ),
    ]);

    // Invalid input is the caller's fault, not a retrieval outage: surface it.
    for (const outcome of [vectorOutcome, keywordOutcome]) {
      if (outcome.status === 'rejected' && outcome.reason instanceof BadRequestException) {
        throw outcome.reason;
      }
    }

    if (vectorOutcome.status === 'rejected' && keywordOutcome.status === 'rejected') {
      throw new Error(
        `Hybrid retrieval failed: vector=${errorMessage(vectorOutcome.reason)}; keyword=${errorMessage(keywordOutcome.reason)}`,
      );
    }

    let vectorResults: SearchResult[] = [];
    let keywordResults: KeywordResult[] = [];

    if (vectorOutcome.status === 'fulfilled') {
      vectorResults = vectorOutcome.value;
    } else {
      this.logger.warn(`vector retrieval failed, using keyword only: ${errorMessage(vectorOutcome.reason)}`);
    }
    if (keywordOutcome.status === 'fulfilled') {
      keywordResults = keywordOutcome.value;
    } else {
      this.logger.warn(`keyword retrieval failed, using vector only: ${errorMessage(keywordOutcome.reason)}`);
    }

    const fused = reciprocalRankFusion(
      vectorResults,
      keywordResults,
      options.rrfK,
      options.finalTopK,
    );

    this.logger.log(
      `hybrid tenantId=${tenantId} queryLength=${query.length} vectorTopK=${options.vectorTopK} keywordTopK=${options.keywordTopK} ` +
        `finalTopK=${options.finalTopK} threshold=${options.similarityThreshold} rrfK=${options.rrfK} ` +
        `vectorCount=${vectorResults.length} keywordCount=${keywordResults.length} finalCount=${fused.length} ` +
        `selected=${fused
          .map((r) => `${r.chunkId}(v#${r.vectorRank ?? '-'},k#${r.keywordRank ?? '-'},f=${r.fusedScore.toFixed(4)})`)
          .join(',')}`,
    );

    return fused;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
