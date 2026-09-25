// Week 3 Day 3 - pure ranking/fallback logic (no I/O, easy to unit test).
// Reranking can only reorder candidates it was given; it cannot recover a
// relevant chunk that first-stage retrieval never returned.

import type { RerankCandidate } from './reranker.types';

export interface RerankedItem<T> {
  item: T;
  rerankerScore: number | null;
  rerankerRank: number;
}

export interface ApplyRerankingResult<T> {
  items: RerankedItem<T>[];
  usedFallback: boolean;
}

export function applyReranking<T extends RerankCandidate>(
  candidates: T[],
  scores: Map<string, number> | null,
  finalTopK: number,
): ApplyRerankingResult<T> {
  const usedFallback = scores === null;

  // Fallback: keep the incoming (original retrieval) order untouched.
  // Otherwise: sort by reranker score desc; ties keep original order (stable).
  const ordered = usedFallback
    ? candidates.map((item) => ({ item, rerankerScore: null as number | null }))
    : candidates
        .map((item, index) => ({
          item,
          rerankerScore: scores!.get(item.chunkId) ?? 0,
          index,
        }))
        .sort((a, b) => b.rerankerScore - a.rerankerScore || a.index - b.index)
        .map(({ item, rerankerScore }) => ({ item, rerankerScore }));

  const items = ordered.slice(0, finalTopK).map((entry, index) => ({
    item: entry.item,
    rerankerScore: entry.rerankerScore,
    rerankerRank: index + 1,
  }));

  return { items, usedFallback };
}
