// Week 3 Day 2 - Reciprocal Rank Fusion (pure, no I/O).
// Each list contributes 1 / (k + rank) per chunk; ranks are 1-based.
// Only ranks are used, so vector and keyword raw scores need no normalization.

import type { HybridResult, KeywordResult } from './retrieval.types';
import type { SearchResult } from '../vectors/vector-db.service';

export function reciprocalRankFusion(
  vectorResults: SearchResult[],
  keywordResults: KeywordResult[],
  rrfK: number,
  finalTopK: number,
): HybridResult[] {
  const merged = new Map<string, HybridResult>();

  vectorResults.forEach((result, index) => {
    const rank = index + 1;
    merged.set(result.id, {
      chunkId: result.id,
      documentId: result.sourceDocumentId,
      tenantId: result.tenantId,
      content: result.content,
      pageNumber: result.pageNumber,
      chunkIndex: result.chunkIndex,
      vectorScore: result.similarity,
      vectorRank: rank,
      fusedScore: 1 / (rrfK + rank),
    });
  });

  keywordResults.forEach((result, index) => {
    const rank = index + 1;
    const contribution = 1 / (rrfK + rank);
    const existing = merged.get(result.id);

    if (existing) {
      existing.keywordScore = result.keywordScore;
      existing.keywordRank = rank;
      existing.fusedScore += contribution;
      return;
    }

    merged.set(result.id, {
      chunkId: result.id,
      documentId: result.sourceDocumentId,
      tenantId: result.tenantId,
      content: result.content,
      pageNumber: result.pageNumber,
      chunkIndex: result.chunkIndex,
      keywordScore: result.keywordScore,
      keywordRank: rank,
      fusedScore: contribution,
    });
  });

  const bestRank = (r: HybridResult) =>
    Math.min(r.vectorRank ?? Infinity, r.keywordRank ?? Infinity);

  return [...merged.values()]
    .sort((a, b) => b.fusedScore - a.fusedScore || bestRank(a) - bestRank(b))
    .slice(0, finalTopK);
}
