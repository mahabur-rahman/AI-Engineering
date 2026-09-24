// Week 3 Day 2 - shared retrieval types.

export interface RetrievalFilters {
  sourceDocumentId?: string;
}

export interface KeywordResult {
  id: string;
  content: string;
  /** ts_rank_cd score (higher = better). Not comparable to vector scores. */
  keywordScore: number;
  sourceDocumentId: string;
  tenantId: string;
  pageNumber?: number;
  chunkIndex?: number;
}

export interface HybridOptions {
  vectorTopK: number;
  keywordTopK: number;
  finalTopK: number;
  /** Applied to the vector side only (cosine score = 1 - distance). */
  similarityThreshold: number;
  /** Drops keyword hits whose ts_rank_cd is below this value. */
  keywordMinScore: number;
  /** RRF constant k in 1 / (k + rank). */
  rrfK: number;
  filters?: RetrievalFilters;
}

export const DEFAULT_HYBRID_OPTIONS: HybridOptions = {
  vectorTopK: 10,
  keywordTopK: 10,
  finalTopK: 5,
  similarityThreshold: 0.5,
  keywordMinScore: 0,
  rrfK: 60,
};

export interface HybridResult {
  chunkId: string;
  documentId: string;
  tenantId: string;
  content: string;
  pageNumber?: number;
  chunkIndex?: number;
  vectorScore?: number;
  keywordScore?: number;
  vectorRank?: number;
  keywordRank?: number;
  fusedScore: number;
}
