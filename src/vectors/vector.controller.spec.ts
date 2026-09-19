import { EmbeddingService } from './embedding.service';
import { SemanticSearchRequest, VectorController } from './vector.controller';
import { SearchResult, VectorDbService } from './vector-db.service';

describe('VectorController retrieval validation', () => {
  const searchResults: SearchResult[] = [];
  let vectorDb: { semanticSearch: jest.Mock };
  let controller: VectorController;

  beforeEach(() => {
    vectorDb = {
      semanticSearch: jest.fn().mockResolvedValue(searchResults),
    };
    controller = new VectorController(
      vectorDb as unknown as VectorDbService,
      {} as EmbeddingService,
    );
  });

  it('requires tenant context for search', async () => {
    const request = { query: 'refund status' } as SemanticSearchRequest;

    await expect(controller.semanticSearch(request)).rejects.toThrow(
      'Tenant ID is required',
    );
    expect(vectorDb.semanticSearch).not.toHaveBeenCalled();
  });

  it('passes tenant and similarity threshold to the retrieval service', async () => {
    await controller.semanticSearch({
      query: 'refund status',
      tenantId: 'tenant-a',
      topK: 8,
      minSimilarity: 0.75,
    });

    expect(vectorDb.semanticSearch).toHaveBeenCalledWith(
      'refund status',
      'tenant-a',
      8,
      0.75,
    );
  });

  it('rejects an invalid similarity threshold', async () => {
    const request = {
      query: 'refund status',
      tenantId: 'tenant-a',
      minSimilarity: 1.1,
    } as SemanticSearchRequest;

    await expect(controller.semanticSearch(request)).rejects.toThrow(
      'minSimilarity must be a number between 0 and 1',
    );
    expect(vectorDb.semanticSearch).not.toHaveBeenCalled();
  });
  it('accepts similarityThreshold as the threshold parameter', async () => {
    await controller.semanticSearch({
      query: 'refund status',
      tenantId: 'tenant-a',
      topK: 3,
      similarityThreshold: 0.6,
    });

    expect(vectorDb.semanticSearch).toHaveBeenCalledWith(
      'refund status',
      'tenant-a',
      3,
      0.6,
    );
  });

  it('returns score and chunk metadata for each result', async () => {
    vectorDb.semanticSearch.mockResolvedValue([
      {
        id: 'chunk-1',
        content: 'Refunds take 5 days.',
        similarity: 0.87,
        sourceDocumentId: 'doc-1',
        tenantId: 'tenant-a',
        pageNumber: 1,
        chunkIndex: 0,
      },
    ]);

    const response = await controller.semanticSearch({
      query: 'refund',
      tenantId: 'tenant-a',
    });

    expect(response.noRelevantContext).toBe(false);
    expect(response.results[0]).toEqual({
      chunkId: 'chunk-1',
      documentId: 'doc-1',
      tenantId: 'tenant-a',
      score: 0.87,
      content: 'Refunds take 5 days.',
      pageNumber: 1,
      chunkIndex: 0,
    });
  });

  it('flags noRelevantContext when nothing passes the threshold', async () => {
    vectorDb.semanticSearch.mockResolvedValue([]);

    const response = await controller.semanticSearch({
      query: 'parking policy',
      tenantId: 'tenant-a',
      similarityThreshold: 0.9,
    });

    expect(response.results).toEqual([]);
    expect(response.noRelevantContext).toBe(true);
  });
});
