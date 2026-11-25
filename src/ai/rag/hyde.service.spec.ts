import { GatewayTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai.service';
import { EmbeddingService } from '../../vectors/embedding.service';
import { HyDEService } from './hyde.service';

const vector = Array(768).fill(0.25);

function build(
  generated: Promise<string>,
  embeddings: jest.Mock = jest.fn().mockResolvedValue({
    embedding: vector,
    model: 'nomic-embed-text',
    dimensions: 768,
  }),
) {
  const ai = {
    generate: jest.fn(() => generated),
    getModelName: jest.fn(() => 'local-llm'),
  };
  const embedding = {
    generateEmbedding: embeddings,
    getDimensions: jest.fn(() => 768),
  };
  const config = { get: jest.fn(() => undefined) };
  return {
    service: new HyDEService(
      ai as unknown as AiService,
      embedding as unknown as EmbeddingService,
      config as unknown as ConfigService,
    ),
    ai,
    embedding,
  };
}

describe('HyDEService', () => {
  it.each([
    ['normal query', 'How long do refunds take?'],
    ['short query', 'Refunds?'],
    ['ambiguous query', 'What is the limit?'],
  ])('embeds generated hypothetical text for a %s', async (_label, query) => {
    const { service, ai, embedding } = build(
      Promise.resolve(
        'Refund policies describe eligibility and processing time.',
      ),
    );
    const result = await service.createRetrievalEmbedding(query);
    expect(ai.generate).toHaveBeenCalledWith(
      expect.stringContaining(query),
      expect.objectContaining({ numPredict: 180, timeoutMs: 15_000 }),
    );
    expect(embedding.generateEmbedding).toHaveBeenCalledWith({
      text: 'Refund policies describe eligibility and processing time.',
    });
    expect(result).toMatchObject({
      embedding: vector,
      usedFallback: false,
      generationModel: 'local-llm',
    });
  });

  it('uses original-query embedding when generated document is empty', async () => {
    const { service, embedding } = build(Promise.resolve('  '));
    const result = await service.createRetrievalEmbedding('Refunds?');
    expect(embedding.generateEmbedding).toHaveBeenCalledWith({
      text: 'Refunds?',
    });
    expect(result).toMatchObject({
      usedFallback: true,
      fallbackReason: 'empty_generation',
    });
  });

  it('rejects an oversized generated document and falls back to original query', async () => {
    const { service, embedding } = build(Promise.resolve('x'.repeat(4001)));
    const result = await service.createRetrievalEmbedding('Refunds?');
    expect(embedding.generateEmbedding).toHaveBeenCalledWith({
      text: 'Refunds?',
    });
    expect(result).toMatchObject({
      usedFallback: true,
      fallbackReason: 'invalid_generation',
    });
  });

  it.each([
    [
      'LLM generation failure',
      Promise.reject(new Error('offline')),
      'generation_failure',
    ],
    [
      'LLM timeout',
      Promise.reject(new GatewayTimeoutException()),
      'generation_failure',
    ],
  ])('falls back on %s', async (_label, generation, reason) => {
    const { service, embedding } = build(generation);
    const result = await service.createRetrievalEmbedding('Original question');
    expect(embedding.generateEmbedding).toHaveBeenCalledWith({
      text: 'Original question',
    });
    expect(result).toMatchObject({
      usedFallback: true,
      fallbackReason: reason,
    });
  });

  it('falls back to original embedding if hypothetical embedding fails', async () => {
    const embeddings = jest
      .fn()
      .mockRejectedValueOnce(new Error('embedding offline'))
      .mockResolvedValueOnce({
        embedding: vector,
        model: 'nomic-embed-text',
        dimensions: 768,
      });
    const { service } = build(
      Promise.resolve('Hypothetical document.'),
      embeddings,
    );
    const result = await service.createRetrievalEmbedding('Original question');
    expect(embeddings).toHaveBeenNthCalledWith(1, {
      text: 'Hypothetical document.',
    });
    expect(embeddings).toHaveBeenNthCalledWith(2, {
      text: 'Original question',
    });
    expect(result).toMatchObject({
      usedFallback: true,
      fallbackReason: 'embedding_failure',
    });
  });

  it('rejects wrong embedding dimensions then safely retries original query', async () => {
    const embeddings = jest
      .fn()
      .mockResolvedValueOnce({
        embedding: [1, 2],
        model: 'wrong',
        dimensions: 2,
      })
      .mockResolvedValueOnce({
        embedding: vector,
        model: 'nomic-embed-text',
        dimensions: 768,
      });
    const { service } = build(
      Promise.resolve('Hypothetical document.'),
      embeddings,
    );
    const result = await service.createRetrievalEmbedding('Original question');
    expect(result).toMatchObject({
      usedFallback: true,
      fallbackReason: 'embedding_failure',
    });
  });

  it('returns a controlled service error if original embedding also fails', async () => {
    const embeddings = jest.fn().mockRejectedValue(new Error('offline'));
    const { service } = build(
      Promise.resolve('Hypothetical document.'),
      embeddings,
    );
    await expect(service.createRetrievalEmbedding('Question')).rejects.toThrow(
      'Unable to create a query embedding',
    );
  });
});
