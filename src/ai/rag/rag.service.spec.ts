import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService } from '../ai.service';
import { RagService } from './rag.service';
import { HybridRetrievalService } from '../../retrieval/hybrid-retrieval.service';
import type { HybridResult } from '../../retrieval/retrieval.types';
import { Reranker } from '../reranking/reranker.types';
import { MultiQueryService } from './multi-query.service';

const hit = (overrides: Partial<HybridResult> = {}): HybridResult => ({
  chunkId: 'chunk-1',
  documentId: 'document-1',
  tenantId: 'tenant-a',
  content: 'Refunds are requested from the billing page.',
  vectorScore: 0.9,
  vectorRank: 1,
  fusedScore: 0.0164,
  ...overrides,
});

const build = (
  search: jest.Mock,
  generate: jest.Mock = jest.fn(),
  rerank: jest.Mock = jest.fn().mockResolvedValue(new Map()),
  generateQueries: jest.Mock = jest.fn(async (question: string) => ({
    queries: [question],
    usedFallback: false,
  })),
) => {
  const retrieval = { search };
  const aiService = { generate };
  const reranker = { rerank };
  const multiQuery = { generateQueries };
  const service = new RagService(
    retrieval as unknown as HybridRetrievalService,
    aiService as unknown as AiService,
    reranker as unknown as Reranker,
    multiQuery as unknown as MultiQueryService,
  );
  return { service, retrieval, aiService, reranker, multiQuery };
};

describe('RagService', () => {
  it('reranks candidates and returns a grounded answer with ordered source metadata', async () => {
    const { service, aiService, reranker } = build(
      jest.fn().mockResolvedValue([
        hit({
          chunkId: 'chunk-1',
          pageNumber: 2,
          chunkIndex: 0,
          keywordScore: 0.4,
          keywordRank: 2,
        }),
        hit({
          chunkId: 'chunk-2',
          content: 'unrelated',
          vectorScore: 0.6,
          vectorRank: 2,
        }),
      ]),
      jest.fn().mockResolvedValue('Request it from the billing page.'),
      jest.fn().mockResolvedValue(
        new Map([
          ['chunk-1', 9],
          ['chunk-2', 1],
        ]),
      ),
    );

    const response = await service.ask({
      question: 'How do I request a refund?',
      tenantId: 'tenant-a',
      topK: 1,
    });

    expect(reranker.rerank).toHaveBeenCalledWith('How do I request a refund?', [
      {
        chunkId: 'chunk-1',
        content: 'Refunds are requested from the billing page.',
      },
      { chunkId: 'chunk-2', content: 'unrelated' },
    ]);
    expect(response.sources).toEqual([
      {
        chunkId: 'chunk-1',
        documentId: 'document-1',
        tenantId: 'tenant-a',
        similarity: 0.9,
        keywordScore: 0.4,
        vectorRank: 1,
        keywordRank: 2,
        fusedScore: 1 / 61,
        rerankerScore: 9,
        rerankerRank: 1,
        queryRanks: [1],
        queryScores: [0.0164],
        matchedQueryCount: 1,
        pageNumber: 2,
        chunkIndex: 0,
      },
    ]);
    expect(aiService.generate).toHaveBeenCalledWith(
      expect.stringContaining('<retrieved_context>'),
      expect.objectContaining({ temperature: 0.1, timeoutMs: 30_000 }),
    );
  });

  it('does not call the reranker or LLM when there are no candidates', async () => {
    const { service, aiService, reranker } = build(
      jest.fn().mockResolvedValue([]),
    );

    await expect(
      service.ask({ question: 'Unknown topic', tenantId: 'tenant-a' }),
    ).resolves.toEqual({
      answer: 'I do not know based on the provided context.',
      sources: [],
    });
    expect(reranker.rerank).not.toHaveBeenCalled();
    expect(aiService.generate).not.toHaveBeenCalled();
  });

  it('falls back to original retrieval order when the reranker fails, without crashing', async () => {
    const { service, aiService } = build(
      jest.fn().mockResolvedValue([
        hit({ chunkId: 'chunk-1' }),
        hit({
          chunkId: 'chunk-2',
          content: 'A different chunk about support.',
        }),
      ]),
      jest.fn().mockResolvedValue('Answer from unreranked context.'),
      jest.fn().mockRejectedValue(new Error('reranker unavailable')),
    );

    const response = await service.ask({
      question: 'How do I request a refund?',
      tenantId: 'tenant-a',
      topK: 2,
    });

    expect(response.sources.map((s) => s.chunkId)).toEqual([
      'chunk-1',
      'chunk-2',
    ]);
    expect(response.sources.every((s) => s.rerankerScore === null)).toBe(true);
    expect(aiService.generate).toHaveBeenCalled();
  });

  it('cannot recover a relevant chunk that was never among the retrieved candidates', async () => {
    const { service, reranker } = build(
      jest
        .fn()
        .mockResolvedValue([
          hit({ chunkId: 'chunk-1', content: 'irrelevant' }),
        ]),
      jest.fn().mockResolvedValue('Best available answer.'),
      jest.fn().mockResolvedValue(new Map([['chunk-1', 1]])),
    );

    const response = await service.ask({
      question: 'How do I request a refund?',
      tenantId: 'tenant-a',
    });

    expect(reranker.rerank).toHaveBeenCalledWith(
      'How do I request a refund?',
      expect.arrayContaining([expect.objectContaining({ chunkId: 'chunk-1' })]),
    );
    expect(response.sources.map((s) => s.chunkId)).toEqual(['chunk-1']);
  });

  it('sends grounding rules and the user question in the RAG prompt', async () => {
    const { service, aiService } = build(
      jest.fn().mockResolvedValue([hit()]),
      jest.fn().mockResolvedValue('Supported answer.'),
      jest.fn().mockResolvedValue(new Map([['chunk-1', 8]])),
    );

    await service.ask({
      question: 'How do I request a refund?',
      tenantId: 'tenant-a',
    });

    const [prompt] = aiService.generate.mock.calls[0] as [string, unknown];
    expect(prompt).toContain(
      'using only the information inside <retrieved_context>',
    );
    expect(prompt).toContain('I do not know based on the provided context.');
    expect(prompt).toContain('<user_question>\nHow do I request a refund?');
  });

  it('rejects invalid request limits before retrieval', async () => {
    const { service, retrieval } = build(jest.fn());

    await expect(
      service.ask({
        question: 'Known question',
        tenantId: 'tenant-a',
        topK: 21,
      }),
    ).rejects.toThrow('topK must be an integer between 1 and 20');
    expect(retrieval.search).not.toHaveBeenCalled();
  });

  it('rejects candidateTopK smaller than topK', async () => {
    const { service, retrieval } = build(jest.fn());

    await expect(
      service.ask({
        question: 'Known question',
        tenantId: 'tenant-a',
        topK: 10,
        candidateTopK: 5,
      }),
    ).rejects.toThrow('candidateTopK must be greater than or equal to topK');
    expect(retrieval.search).not.toHaveBeenCalled();
  });

  it('maps LLM failures to a gateway error', async () => {
    const { service } = build(
      jest.fn().mockResolvedValue([hit({ content: 'Known fact.' })]),
      jest.fn().mockRejectedValue(new Error('Ollama unavailable')),
      jest.fn().mockResolvedValue(new Map([['chunk-1', 8]])),
    );

    await expect(
      service.ask({ question: 'Known question', tenantId: 'tenant-a' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps retrieval failures to service-unavailable without calling the reranker or LLM', async () => {
    const { service, aiService, reranker } = build(
      jest.fn().mockRejectedValue(new Error('DB unreachable')),
    );

    await expect(
      service.ask({ question: 'Known question', tenantId: 'tenant-a' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(reranker.rerank).not.toHaveBeenCalled();
    expect(aiService.generate).not.toHaveBeenCalled();
  });

  it('passes tenant, candidateTopK and retrieval overrides to hybrid retrieval', async () => {
    const { service, retrieval } = build(jest.fn().mockResolvedValue([]));

    await service.ask({
      question: 'Known question',
      tenantId: 'tenant-b',
      topK: 3,
      candidateTopK: 15,
      vectorTopK: 8,
      keywordTopK: 6,
      rrfK: 30,
      similarityThreshold: 0.6,
    });

    expect(retrieval.search).toHaveBeenCalledWith(
      'Known question',
      'tenant-b',
      {
        finalTopK: 15,
        vectorTopK: 8,
        keywordTopK: 6,
        rrfK: 30,
        similarityThreshold: 0.6,
      },
    );
  });

  it('defaults candidateTopK to at least the built-in floor when not provided', async () => {
    const { service, retrieval } = build(jest.fn().mockResolvedValue([]));

    await service.ask({
      question: 'Known question',
      tenantId: 'tenant-a',
      topK: 5,
    });

    expect(retrieval.search).toHaveBeenCalledWith(
      'Known question',
      'tenant-a',
      expect.objectContaining({ finalTopK: 20 }),
    );
  });

  it('retrieves each generated query, merges chunks, and preserves multi-query diagnostics', async () => {
    const { service, retrieval, multiQuery, reranker } = build(
      jest
        .fn()
        .mockResolvedValueOnce([
          hit({ chunkId: 'shared', content: 'shared fact' }),
          hit({ chunkId: 'a' }),
        ])
        .mockResolvedValueOnce([
          hit({ chunkId: 'shared', content: 'shared fact' }),
          hit({ chunkId: 'b' }),
        ]),
      jest.fn().mockResolvedValue('Grounded answer.'),
      jest.fn().mockResolvedValue(
        new Map([
          ['shared', 9],
          ['a', 2],
          ['b', 1],
        ]),
      ),
      jest.fn().mockResolvedValue({
        queries: ['How do I request a refund?', 'refund application process'],
        usedFallback: false,
      }),
    );

    const response = await service.ask({
      question: 'How do I request a refund?',
      tenantId: 'tenant-a',
      topK: 3,
      candidateTopK: 5,
      queryCount: 2,
    });

    expect(multiQuery.generateQueries).toHaveBeenCalledWith(
      'How do I request a refund?',
      2,
    );
    expect(retrieval.search).toHaveBeenCalledTimes(2);
    expect(reranker.rerank).toHaveBeenCalledWith(
      'How do I request a refund?',
      expect.arrayContaining([expect.objectContaining({ chunkId: 'shared' })]),
    );
    expect(
      response.sources.find((source) => source.chunkId === 'shared'),
    ).toMatchObject({
      matchedQueryCount: 2,
      queryRanks: [1, 1],
    });
  });

  it('rejects queryCount outside the supported range before query generation', async () => {
    const { service, multiQuery } = build(jest.fn());
    await expect(
      service.ask({ question: 'q', tenantId: 'tenant-a', queryCount: 6 }),
    ).rejects.toThrow('queryCount must be an integer between 1 and 5');
    expect(multiQuery.generateQueries).not.toHaveBeenCalled();
  });

  it('continues with successful query retrievals when one expanded query fails', async () => {
    const { service, retrieval } = build(
      jest
        .fn()
        .mockRejectedValueOnce(new Error('temporary retrieval failure'))
        .mockResolvedValueOnce([
          hit({ chunkId: 'chunk-2', content: 'Known fact.' }),
        ]),
      jest.fn().mockResolvedValue('Answer from the surviving query.'),
      jest.fn().mockResolvedValue(new Map([['chunk-2', 8]])),
      jest.fn().mockResolvedValue({
        queries: ['original question', 'expanded question'],
        usedFallback: false,
      }),
    );

    await expect(
      service.ask({
        question: 'original question',
        tenantId: 'tenant-a',
        queryCount: 2,
      }),
    ).resolves.toMatchObject({
      answer: 'Answer from the surviving query.',
      sources: [expect.objectContaining({ chunkId: 'chunk-2' })],
    });
    expect(retrieval.search).toHaveBeenCalledTimes(2);
  });

  it('returns a controlled service error when every query retrieval fails', async () => {
    const { service, aiService, reranker } = build(
      jest.fn().mockRejectedValue(new Error('database unavailable')),
      jest.fn(),
      jest.fn(),
      jest.fn().mockResolvedValue({
        queries: ['original question', 'expanded question'],
        usedFallback: false,
      }),
    );

    await expect(
      service.ask({
        question: 'original question',
        tenantId: 'tenant-a',
        queryCount: 2,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(reranker.rerank).not.toHaveBeenCalled();
    expect(aiService.generate).not.toHaveBeenCalled();
  });
});
