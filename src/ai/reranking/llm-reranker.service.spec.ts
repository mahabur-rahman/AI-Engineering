import { LlmRerankerService } from './llm-reranker.service';
import { AiService } from '../ai.service';

const build = (generate: jest.Mock) =>
  new LlmRerankerService({ generate } as unknown as AiService);

describe('LlmRerankerService', () => {
  it('returns an empty map without calling the LLM for zero candidates', async () => {
    const generate = jest.fn();
    const scores = await build(generate).rerank('q', []);
    expect(scores.size).toBe(0);
    expect(generate).not.toHaveBeenCalled();
  });

  it('parses a valid JSON score response into a chunkId -> score map', async () => {
    const generate = jest
      .fn()
      .mockResolvedValue('{"scores":[{"chunkId":"a","score":9},{"chunkId":"b","score":2}]}');
    const scores = await build(generate).rerank('q', [
      { chunkId: 'a', content: 'x' },
      { chunkId: 'b', content: 'y' },
    ]);
    expect(scores).toEqual(new Map([['a', 9], ['b', 2]]));
  });

  it('strips markdown fences before parsing', async () => {
    const generate = jest
      .fn()
      .mockResolvedValue('```json\n{"scores":[{"chunkId":"a","score":7}]}\n```');
    const scores = await build(generate).rerank('q', [{ chunkId: 'a', content: 'x' }]);
    expect(scores.get('a')).toBe(7);
  });

  it('defaults an omitted chunkId to score 0 instead of dropping it', async () => {
    const generate = jest.fn().mockResolvedValue('{"scores":[{"chunkId":"a","score":9}]}');
    const scores = await build(generate).rerank('q', [
      { chunkId: 'a', content: 'x' },
      { chunkId: 'b', content: 'y' },
    ]);
    expect(scores.get('b')).toBe(0);
  });

  it('ignores a chunkId in the response that was not among the candidates', async () => {
    const generate = jest
      .fn()
      .mockResolvedValue('{"scores":[{"chunkId":"a","score":9},{"chunkId":"unknown","score":10}]}');
    const scores = await build(generate).rerank('q', [{ chunkId: 'a', content: 'x' }]);
    expect(scores.has('unknown')).toBe(false);
  });

  it('throws on malformed JSON', async () => {
    const generate = jest.fn().mockResolvedValue('not json at all');
    await expect(
      build(generate).rerank('q', [{ chunkId: 'a', content: 'x' }]),
    ).rejects.toThrow('reranker returned invalid JSON');
  });

  it('throws when the JSON does not match the expected schema', async () => {
    const generate = jest.fn().mockResolvedValue('{"scores":[{"chunkId":"a","score":99}]}');
    await expect(
      build(generate).rerank('q', [{ chunkId: 'a', content: 'x' }]),
    ).rejects.toThrow('reranker JSON failed schema validation');
  });
});
