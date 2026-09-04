import {
  chunkDocumentFixedSize,
  cleanDocumentText,
  validateChunks,
} from './chunking.util';

describe('document chunking pipeline', () => {
  it('cleans control characters and normalizes whitespace', () => {
    expect(cleanDocumentText('  Hello\r\n\r\n world\u0000\t  test  ')).toBe(
      'Hello\n\n world test',
    );
  });

  it('creates bounded chunks with overlap', () => {
    const chunks = chunkDocumentFixedSize('a'.repeat(100), 30, 5);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content).toHaveLength(30);
    expect(chunks[1].startChar).toBe(25);
    expect(chunks.at(-1)?.endChar).toBe(100);
  });

  it('rejects unsafe chunk parameters', () => {
    expect(chunkDocumentFixedSize('some content', 10, 10)).toEqual([]);
    expect(chunkDocumentFixedSize('some content', 0, 0)).toEqual([]);
  });

  it('detects duplicate and invalid chunks', () => {
    const result = validateChunks([
      { content: 'This is a valid chunk of text.', index: 0, startChar: 0, endChar: 31 },
      { content: 'This is a valid chunk of text.', index: 1, startChar: 31, endChar: 20 },
    ]);

    expect(result.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Chunk 1: duplicate content',
        'Chunk 1: invalid character offsets',
      ]),
    );
  });
});
