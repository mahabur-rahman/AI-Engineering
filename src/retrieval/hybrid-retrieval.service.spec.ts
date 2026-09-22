import { BadRequestException } from '@nestjs/common';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import type { VectorDbService, SearchResult } from '../vectors/vector-db.service';
import type { KeywordRetrievalService } from './keyword-retrieval.service';
import type { KeywordResult } from './retrieval.types';

const v = (id: string): SearchResult => ({
  id, content: `c-${id}`, similarity: 0.8, sourceDocumentId: 'd', tenantId: 't',
});
const k = (id: string): KeywordResult => ({
  id, content: `c-${id}`, keywordScore: 0.3, sourceDocumentId: 'd', tenantId: 't',
});

const build = (vector: jest.Mock, keyword: jest.Mock) => {
  const service = new HybridRetrievalService(
    { semanticSearch: vector } as unknown as VectorDbService,
    { search: keyword } as unknown as KeywordRetrievalService,
  );
  return service;
};

describe('HybridRetrievalService', () => {
  it('uses vector results only when keyword finds nothing', async () => {
    const r = await build(jest.fn().mockResolvedValue([v('a')]), jest.fn().mockResolvedValue([])).search('q', 't');
    expect(r.map((x) => x.chunkId)).toEqual(['a']);
    expect(r[0].keywordRank).toBeUndefined();
  });

  it('uses keyword results only when vector finds nothing', async () => {
    const r = await build(jest.fn().mockResolvedValue([]), jest.fn().mockResolvedValue([k('a')])).search('q', 't');
    expect(r.map((x) => x.chunkId)).toEqual(['a']);
    expect(r[0].vectorRank).toBeUndefined();
  });

  it('merges both result sets and deduplicates overlapping chunks', async () => {
    const r = await build(
      jest.fn().mockResolvedValue([v('a'), v('b')]),
      jest.fn().mockResolvedValue([k('b'), k('c')]),
    ).search('q', 't');
    expect(r.map((x) => x.chunkId)).toEqual(['b', 'a', 'c']);
  });

  it('returns an empty array when nothing matches', async () => {
    const r = await build(jest.fn().mockResolvedValue([]), jest.fn().mockResolvedValue([])).search('q', 't');
    expect(r).toEqual([]);
  });

  it('degrades to the surviving retriever when one side fails', async () => {
    const r = await build(
      jest.fn().mockRejectedValue(new Error('embedding down')),
      jest.fn().mockResolvedValue([k('a')]),
    ).search('q', 't');
    expect(r.map((x) => x.chunkId)).toEqual(['a']);
  });

  it('throws when both retrievers fail', async () => {
    await expect(
      build(jest.fn().mockRejectedValue(new Error('x')), jest.fn().mockRejectedValue(new Error('y'))).search('q', 't'),
    ).rejects.toThrow('Hybrid retrieval failed');
  });

  it('passes configured Top-K values, threshold and filters to each retriever', async () => {
    const vector = jest.fn().mockResolvedValue([]);
    const keyword = jest.fn().mockResolvedValue([]);
    await build(vector, keyword).search('q', 't', {
      vectorTopK: 7, keywordTopK: 4, similarityThreshold: 0.6, keywordMinScore: 0.1,
      filters: { sourceDocumentId: 'doc-1' },
    });
    expect(vector).toHaveBeenCalledWith('q', 't', 7, 0.6, { sourceDocumentId: 'doc-1' });
    expect(keyword).toHaveBeenCalledWith('q', 't', 4, 0.1, { sourceDocumentId: 'doc-1' });
  });

  it('applies the final Top-K limit', async () => {
    const r = await build(
      jest.fn().mockResolvedValue([v('a'), v('b'), v('c')]),
      jest.fn().mockResolvedValue([k('d'), k('e')]),
    ).search('q', 't', { finalTopK: 2 });
    expect(r).toHaveLength(2);
  });

  it('rejects invalid configuration and empty input before retrieval', async () => {
    const vector = jest.fn();
    const service = build(vector, jest.fn());
    await expect(service.search('q', 't', { finalTopK: 0 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search('q', 't', { similarityThreshold: 2 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search('q', 't', { rrfK: 0 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search('  ', 't')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search('q', ' ')).rejects.toBeInstanceOf(BadRequestException);
    expect(vector).not.toHaveBeenCalled();
  });

  it('surfaces a BadRequest from a retriever instead of masking it as an outage', async () => {
    await expect(
      build(jest.fn().mockRejectedValue(new BadRequestException('bad')), jest.fn().mockResolvedValue([])).search('q', 't'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
