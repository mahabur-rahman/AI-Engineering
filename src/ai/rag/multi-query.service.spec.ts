import { AiService } from '../ai.service';
import {
  MultiQueryService,
  mergeMultiQueryResults,
} from './multi-query.service';

const buildService = (generate: jest.Mock) =>
  new MultiQueryService({ generate } as unknown as AiService);

describe('MultiQueryService', () => {
  it('preserves the original query and filters duplicate or invalid alternatives', async () => {
    const generate = jest.fn().mockResolvedValue(
      JSON.stringify({
        queries: [
          '  refund policy  ',
          'HOW DO I REQUEST A REFUND?',
          '',
          '!!!',
          'refund policy',
          'billing page refund request',
        ],
      }),
    );

    const result = await buildService(generate).generateQueries(
      'How do I request a refund?',
      3,
    );

    expect(result).toEqual({
      queries: [
        'How do I request a refund?',
        'refund policy',
        'billing page refund request',
      ],
      usedFallback: false,
    });
    expect(generate).toHaveBeenCalledWith(
      expect.stringContaining('<user_query>'),
      expect.objectContaining({ timeoutMs: 15_000 }),
    );
  });

  it('returns only the original query when generation fails or returns invalid JSON', async () => {
    const unavailable = buildService(
      jest.fn().mockRejectedValue(new Error('timeout')),
    );
    await expect(
      unavailable.generateQueries('refund status', 3),
    ).resolves.toEqual({
      queries: ['refund status'],
      usedFallback: true,
    });

    const invalid = buildService(jest.fn().mockResolvedValue('not JSON'));
    await expect(invalid.generateQueries('refund status', 3)).resolves.toEqual({
      queries: ['refund status'],
      usedFallback: true,
    });
  });

  it('skips generation when only the original query is requested', async () => {
    const generate = jest.fn();
    await expect(
      buildService(generate).generateQueries('invoice INV-20', 1),
    ).resolves.toEqual({
      queries: ['invoice INV-20'],
      usedFallback: false,
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('marks an empty set of valid alternatives as an original-query fallback', async () => {
    const generate = jest.fn().mockResolvedValue('{"queries":["  ", "!!!"]}');
    await expect(
      buildService(generate).generateQueries('refund timing', 3),
    ).resolves.toEqual({
      queries: ['refund timing'],
      usedFallback: true,
    });
  });
});

describe('mergeMultiQueryResults', () => {
  const result = (
    chunkId: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    chunkId,
    documentId: `doc-${chunkId}`,
    tenantId: 'tenant-a',
    content: `content ${chunkId}`,
    vectorScore: 0.7,
    vectorRank: 1,
    fusedScore: 1 / 61,
    ...overrides,
  });

  it('deduplicates by chunk ID, applies rank fusion, and preserves source fields', () => {
    const merged = mergeMultiQueryResults(
      [
        [result('shared', { pageNumber: 2 }), result('first-only')],
        [
          result('shared', { vectorScore: 0.9, keywordScore: 0.3 }),
          result('second-only'),
        ],
      ],
      10,
    );

    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({
      chunkId: 'shared',
      documentId: 'doc-shared',
      pageNumber: 2,
      vectorScore: 0.9,
      keywordScore: 0.3,
      queryRanks: [1, 1],
      queryScores: [1 / 61, 1 / 61],
      matchedQueryCount: 2,
      fusedScore: 2 / 61,
    });
  });

  it('applies candidateTopK after merging all query result sets', () => {
    const merged = mergeMultiQueryResults(
      [
        [result('a'), result('b')],
        [result('c'), result('d')],
      ],
      2,
    );
    expect(merged).toHaveLength(2);
    expect(merged.every((item) => item.queryRanks.length > 0)).toBe(true);
  });
});
