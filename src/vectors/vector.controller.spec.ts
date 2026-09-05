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
});
