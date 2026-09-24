import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService } from '../ai.service';
import { RagService } from './rag.service';
import { HybridRetrievalService } from '../../retrieval/hybrid-retrieval.service';
import type { HybridResult } from '../../retrieval/retrieval.types';

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

const build = (search: jest.Mock, generate: jest.Mock = jest.fn()) => {
  const retrieval = { search };
  const aiService = { generate };
  const service = new RagService(
    retrieval as unknown as HybridRetrievalService,
    aiService as unknown as AiService,
  );
  return { service, retrieval, aiService };
};

describe('RagService', () => {
  it('returns a grounded answer with ordered source metadata', async () => {
    const { service, aiService } = build(
      jest.fn().mockResolvedValue([
        hit({ pageNumber: 2, chunkIndex: 0, keywordScore: 0.4, keywordRank: 2 }),
      ]),
      jest.fn().mockResolvedValue('Request it from the billing page.'),
    );

    const response = await service.ask({
      question: 'How do I request a refund?',
      tenantId: 'tenant-a',
    });

    expect(response).toEqual({
      answer: 'Request it from the billing page.',
      sources: [
        {
          chunkId: 'chunk-1',
          documentId: 'document-1',
          tenantId: 'tenant-a',
          similarity: 0.9,
          keywordScore: 0.4,
          vectorRank: 1,
          keywordRank: 2,
          fusedScore: 0.0164,
          pageNumber: 2,
          chunkIndex: 0,
        },
      ],
    });
    expect(aiService.generate).toHaveBeenCalledWith(
      expect.stringContaining('<retrieved_context>'),
      expect.objectContaining({ temperature: 0.1, timeoutMs: 30_000 }),
    );
  });

  it('does not call the LLM when retrieval has no useful context', async () => {
    const { service, aiService } = build(jest.fn().mockResolvedValue([]));

    await expect(
      service.ask({ question: 'Unknown topic', tenantId: 'tenant-a' }),
    ).resolves.toEqual({
      answer: 'I do not know based on the provided context.',
      sources: [],
    });
    expect(aiService.generate).not.toHaveBeenCalled();
  });

  it('sends grounding rules and the user question in the RAG prompt', async () => {
    const { service, aiService } = build(
      jest.fn().mockResolvedValue([hit()]),
      jest.fn().mockResolvedValue('Supported answer.'),
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

  it('maps LLM failures to a gateway error', async () => {
    const { service } = build(
      jest.fn().mockResolvedValue([hit({ content: 'Known fact.' })]),
      jest.fn().mockRejectedValue(new Error('Ollama unavailable')),
    );

    await expect(
      service.ask({ question: 'Known question', tenantId: 'tenant-a' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps retrieval failures to service-unavailable without calling the LLM', async () => {
    const { service, aiService } = build(
      jest.fn().mockRejectedValue(new Error('DB unreachable')),
    );

    await expect(
      service.ask({ question: 'Known question', tenantId: 'tenant-a' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(aiService.generate).not.toHaveBeenCalled();
  });

  it('passes tenant, final Top-K and retrieval overrides to hybrid retrieval', async () => {
    const { service, retrieval } = build(jest.fn().mockResolvedValue([]));

    await service.ask({
      question: 'Known question',
      tenantId: 'tenant-b',
      topK: 3,
      vectorTopK: 8,
      keywordTopK: 6,
      rrfK: 30,
      similarityThreshold: 0.6,
    });

    expect(retrieval.search).toHaveBeenCalledWith('Known question', 'tenant-b', {
      finalTopK: 3,
      vectorTopK: 8,
      keywordTopK: 6,
      rrfK: 30,
      similarityThreshold: 0.6,
    });
  });
});
