import { applyReranking } from './reranker';

const c = (chunkId: string, content = 'x') => ({ chunkId, content });

describe('applyReranking', () => {
  it('sorts candidates by reranker score, highest first', () => {
    const scores = new Map([
      ['a', 2],
      ['b', 9],
      ['c', 5],
    ]);
    const { items, usedFallback } = applyReranking(
      [c('a'), c('b'), c('c')],
      scores,
      3,
    );
    expect(items.map((i) => i.item.chunkId)).toEqual(['b', 'c', 'a']);
    expect(items.map((i) => i.rerankerRank)).toEqual([1, 2, 3]);
    expect(usedFallback).toBe(false);
  });

  it('defaults a missing score to 0', () => {
    const scores = new Map([['a', 8]]);
    const { items } = applyReranking([c('a'), c('b')], scores, 2);
    expect(items[1]).toMatchObject({ rerankerScore: 0 });
  });

  it('breaks ties by keeping original (retrieval) order', () => {
    const scores = new Map([
      ['a', 5],
      ['b', 5],
    ]);
    const { items } = applyReranking([c('a'), c('b')], scores, 2);
    expect(items.map((i) => i.item.chunkId)).toEqual(['a', 'b']);
  });

  it('applies the final Top-K limit after sorting', () => {
    const scores = new Map([
      ['a', 1],
      ['b', 9],
      ['c', 5],
    ]);
    const { items } = applyReranking([c('a'), c('b'), c('c')], scores, 1);
    expect(items.map((i) => i.item.chunkId)).toEqual(['b']);
  });

  it('keeps the original retrieval order and marks fallback when scores are null', () => {
    const { items, usedFallback } = applyReranking([c('a'), c('b'), c('c')], null, 2);
    expect(items.map((i) => i.item.chunkId)).toEqual(['a', 'b']);
    expect(items.every((i) => i.rerankerScore === null)).toBe(true);
    expect(usedFallback).toBe(true);
  });

  it('cannot recover a candidate that was never in the input list', () => {
    const scores = new Map([['a', 1], ['missing-chunk', 10]]);
    const { items } = applyReranking([c('a')], scores, 5);
    expect(items.map((i) => i.item.chunkId)).toEqual(['a']);
  });

  it('returns an empty list for an empty candidate set', () => {
    expect(applyReranking([], new Map(), 5).items).toEqual([]);
  });
});
