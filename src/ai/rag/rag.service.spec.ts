import { BadGatewayException } from '@nestjs/common';
import { AiService } from '../ai.service';
import { RagService } from './rag.service';
import { VectorDbService } from '../../vectors/vector-db.service';

describe('RagService', () => {
  it('returns a grounded answer with ordered source metadata', async () => {
    const vectorDb = {
      semanticSearch: jest.fn().mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'Refunds are requested from the billing page.',
          similarity: 0.9,
          sourceDocumentId: 'document-1',
          tenantId: 'tenant-a',
          pageNumber: 2,
          chunkIndex: 0,
        },
      ]),
    };
    const aiService = {
      generate: jest
        .fn()
        .mockResolvedValue('Request it from the billing page.'),
    };
    const service = new RagService(
      vectorDb as unknown as VectorDbService,
      aiService as unknown as AiService,
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
    const vectorDb = {
      semanticSearch: jest.fn().mockResolvedValue([]),
    };
    const aiService = { generate: jest.fn() };
    const service = new RagService(
      vectorDb as unknown as VectorDbService,
      aiService as unknown as AiService,
    );

    await expect(
      service.ask({ question: 'Unknown topic', tenantId: 'tenant-a' }),
    ).resolves.toEqual({
      answer: 'I do not know based on the provided context.',
      sources: [],
    });
    expect(aiService.generate).not.toHaveBeenCalled();
  });

  it('sends grounding rules and the user question in the RAG prompt', async () => {
    const vectorDb = {
      semanticSearch: jest.fn().mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'Refunds are requested from the billing page.',
          similarity: 0.9,
          sourceDocumentId: 'document-1',
          tenantId: 'tenant-a',
        },
      ]),
    };
    const aiService = {
      generate: jest.fn().mockResolvedValue('Supported answer.'),
    };
    const service = new RagService(
      vectorDb as unknown as VectorDbService,
      aiService as unknown as AiService,
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
    const vectorDb = { semanticSearch: jest.fn() };
    const aiService = { generate: jest.fn() };
    const service = new RagService(
      vectorDb as unknown as VectorDbService,
      aiService as unknown as AiService,
    );

    await expect(
      service.ask({
        question: 'Known question',
        tenantId: 'tenant-a',
        topK: 21,
      }),
    ).rejects.toThrow('topK must be an integer between 1 and 20');
    expect(vectorDb.semanticSearch).not.toHaveBeenCalled();
  });

  it('maps LLM failures to a gateway error', async () => {
    const vectorDb = {
      semanticSearch: jest.fn().mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'Known fact.',
          similarity: 0.9,
          sourceDocumentId: 'document-1',
          tenantId: 'tenant-a',
        },
      ]),
    };
    const aiService = {
      generate: jest.fn().mockRejectedValue(new Error('Ollama unavailable')),
    };
    const service = new RagService(
      vectorDb as unknown as VectorDbService,
      aiService as unknown as AiService,
    );

    await expect(
      service.ask({ question: 'Known question', tenantId: 'tenant-a' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
