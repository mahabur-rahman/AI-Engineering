import { reciprocalRankFusion } from './fusion';
import type { SearchResult } from '../vectors/vector-db.service';
import type { KeywordResult } from './retrieval.types';

const v = (id: string, similarity = 0.9): SearchResult => ({
  id,
  content: `content ${id}`,
  similarity,
  sourceDocumentId: `doc-${id}`,
  tenantId: 't',
});
const k = (id: string, keywordScore = 0.5): KeywordResult => ({
  id,
  content: `content ${id}`,
  keywordScore,
  sourceDocumentId: `doc-${id}`,
  tenantId: 't',
});

describe('reciprocalRankFusion', () => {
  it('scores rank 1 as 1/(k+1)', () => {
    const [top] = reciprocalRankFusion([v('a')], [], 60, 5);
    expect(top.fusedScore).toBeCloseTo(1 / 61, 10);
    expect(top.vectorRank).toBe(1);
    expect(top.keywordRank).toBeUndefined();
  });

  it('deduplicates by chunk id and sums both contributions', () => {
    const results = reciprocalRankFusion([v('a'), v('b')], [k('b'), k('c')], 60, 5);
    const b = results.find((r) => r.chunkId === 'b');

    expect(results.map((r) => r.chunkId).sort()).toEqual(['a', 'b', 'c']);
    expect(b?.fusedScore).toBeCloseTo(1 / 62 + 1 / 61, 10);
    expect(b).toMatchObject({ vectorRank: 2, keywordRank: 1, vectorScore: 0.9, keywordScore: 0.5 });
  });

  it('ranks a chunk found by both lists above single-list chunks', () => {
    const results = reciprocalRankFusion([v('a'), v('shared')], [k('shared'), k('c')], 60, 5);
    expect(results[0].chunkId).toBe('shared');
  });

  it('applies the final Top-K limit', () => {
    const results = reciprocalRankFusion([v('a'), v('b'), v('c')], [k('d')], 60, 2);
    expect(results).toHaveLength(2);
  });

  it('returns an empty list when both lists are empty', () => {
    expect(reciprocalRankFusion([], [], 60, 5)).toEqual([]);
  });

  it('uses only ranks, so raw score scales do not matter', () => {
    const a = reciprocalRankFusion([v('x', 0.99)], [k('y', 900)], 60, 5);
    const b = reciprocalRankFusion([v('x', 0.01)], [k('y', 0.001)], 60, 5);
    expect(a.map((r) => r.chunkId)).toEqual(b.map((r) => r.chunkId));
  });
});
