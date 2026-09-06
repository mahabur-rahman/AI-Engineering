import { buildRetrievedContext } from './context-builder';
import type { SearchResult } from '../../vectors/vector-db.service';

const result = (content: string, id: string): SearchResult => ({
  id,
  content,
  similarity: 0.9,
  sourceDocumentId: 'document-1',
  tenantId: 'tenant-a',
});

describe('buildRetrievedContext', () => {
  it('preserves relevance order and removes duplicate content', () => {
    const output = buildRetrievedContext([
      result('First relevant fact.', 'chunk-1'),
      result(' First   relevant fact. ', 'chunk-2'),
      result('Second relevant fact.', 'chunk-3'),
    ]);

    expect(output.sources.map((source) => source.id)).toEqual([
      'chunk-1',
      'chunk-3',
    ]);
    expect(output.context).toContain('[Source 1]\nFirst relevant fact.');
    expect(output.context).toContain('[Source 2]\nSecond relevant fact.');
  });

  it('stops before exceeding the context budget', () => {
    const output = buildRetrievedContext(
      [result('A'.repeat(20), 'chunk-1'), result('B'.repeat(20), 'chunk-2')],
      35,
    );

    expect(output.sources).toHaveLength(1);
    expect(output.context.length).toBeLessThanOrEqual(35);
  });

  it('skips an oversized chunk and keeps later chunks that fit', () => {
    const output = buildRetrievedContext(
      [
        result('A'.repeat(100), 'chunk-1'),
        result('Short relevant fact.', 'chunk-2'),
      ],
      50,
    );

    expect(output.sources.map((source) => source.id)).toEqual(['chunk-2']);
    expect(output.context).toContain('[Source 1]\nShort relevant fact.');
    expect(output.context.length).toBeLessThanOrEqual(50);
  });
});
