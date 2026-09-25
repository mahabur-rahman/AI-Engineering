// Week 3 Day 3 - reranker abstraction.
// A different implementation (e.g. a real Cross-Encoder served from a
// separate process) can be swapped in later by registering it in
// ai.module.ts instead of LlmRerankerService; RagService only depends on
// this abstract class, never on a concrete implementation.

export interface RerankCandidate {
  chunkId: string;
  content: string;
}

export abstract class Reranker {
  /** Returns a chunkId -> score (0-10, higher = more relevant) map. Throws on failure. */
  abstract rerank(
    query: string,
    candidates: RerankCandidate[],
  ): Promise<Map<string, number>>;
}
