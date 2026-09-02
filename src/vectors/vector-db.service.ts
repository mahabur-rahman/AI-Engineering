// Week 2 Day 2 - Vector Database Service
// What: Stores chunks + embeddings in PostgreSQL + pgvector
// Why: PostgreSQL integrates with existing stack, pgvector adds vector search
// Where used: Ingesting documents and searching semantically

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

// =====================================================
// TYPES
// =====================================================

export interface StoreChunkRequest {
  content: string;
  embedding: number[];
  sourceDocumentId: string;
  pageNumber?: number;
  chunkIndex?: number;
}

export interface StoreDocumentRequest {
  title: string;
  source?: string;
  chunks: Array<{
    content: string;
    embedding: number[];
    pageNumber?: number;
    chunkIndex?: number;
  }>;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity: number; // cosine similarity score 0-1
  sourceDocumentId: string;
  pageNumber?: number;
  chunkIndex?: number;
}

// =====================================================
// VECTOR DATABASE SERVICE
// =====================================================

@Injectable()
export class VectorDbService {
  private prisma: PrismaClient;

  constructor(private embeddingService: EmbeddingService) {
    this.prisma = new PrismaClient();
  }

  // =====================================================
  // Store single chunk with embedding
  // =====================================================
  // How it works:
  // 1. Validate chunk content and embedding dimensions
  // 2. Insert into DocumentChunk table
  // 3. pgvector automatically indexes for fast search
  //
  // Why check dimensions?
  // - Must match the vector(1536) column definition
  // - If mismatch, PostgreSQL throws error

  async storeChunk(request: StoreChunkRequest): Promise<string> {
    const { content, embedding, sourceDocumentId, pageNumber, chunkIndex } =
      request;

    // Validation
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Chunk content cannot be empty');
    }

    if (!embedding || embedding.length === 0) {
      throw new BadRequestException('Embedding vector cannot be empty');
    }

    // Check dimension match
    const expectedDim = 1536; // Must match schema
    if (embedding.length !== expectedDim) {
      throw new BadRequestException(
        `Embedding dimension mismatch: got ${embedding.length}, expected ${expectedDim}`,
      );
    }

    try {
      // Insert into database
      // Note: Prisma can't directly handle pgvector, so we use raw SQL
      const result = await this.prisma.$queryRaw`
        INSERT INTO "DocumentChunk" (
          id, 
          content, 
          embedding, 
          "sourceDocumentId", 
          "pageNumber", 
          "chunkIndex", 
          "createdAt",
          "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${content},
          ${JSON.stringify(embedding)}::vector,
          ${sourceDocumentId},
          ${pageNumber || null},
          ${chunkIndex || null},
          NOW(),
          NOW()
        )
        RETURNING id;
      `;

      // Extract ID from result
      const id = (result as Array<{ id: string }>)[0]?.id;
      if (!id) {
        throw new Error('Failed to get inserted chunk ID');
      }

      return id;
    } catch (error) {
      throw new Error(
        `Failed to store chunk: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =====================================================
  // Store entire document with all chunks
  // =====================================================
  // How it works:
  // 1. Create Document record
  // 2. Store all chunks for that document
  // 3. Return document ID for reference
  //
  // Why transaction-like approach?
  // - Ensures consistency between Document and Chunks
  // - If any chunk fails, whole operation fails
  // - In production, use proper Prisma transactions

  async storeDocument(request: StoreDocumentRequest): Promise<string> {
    const { title, source, chunks } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestException('Document title cannot be empty');
    }

    if (!chunks || chunks.length === 0) {
      throw new BadRequestException('Document must have at least one chunk');
    }

    try {
      // Step 1: Create document record
      const docId = Math.random().toString(36).substring(2);

      await this.prisma.$queryRaw`
        INSERT INTO "Document" (id, title, source, language, "isActive", "createdAt", "updatedAt")
        VALUES (${docId}, ${title}, ${source || null}, 'en', true, NOW(), NOW())
      `;

      // Step 2: Store all chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await this.storeChunk({
          content: chunk.content,
          embedding: chunk.embedding,
          sourceDocumentId: docId,
          pageNumber: chunk.pageNumber,
          chunkIndex: i,
        });
      }

      return docId;
    } catch (error) {
      throw new Error(
        `Failed to store document: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =====================================================
  // Semantic search: Find similar chunks
  // =====================================================
  // How it works:
  // 1. Convert query to embedding
  // 2. Use PostgreSQL cosine similarity to find close vectors
  // 3. Return top K results with similarity scores
  //
  // Why cosine similarity?
  // - Measures angle between vectors, not raw distance
  // - Better for text embeddings (magnitude less important)
  // - Returns score between -1 and 1 (typically 0-1 for similar)
  //
  // pgvector similarity operation:
  // - <=> operator = cosine similarity distance
  // - closer to 0 = more similar
  // - further from 1 = less similar
  // - we convert to 1 - distance = similarity score 0-1

  async semanticSearch(
    query: string,
    topK: number = 5,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query cannot be empty');
    }

    if (topK <= 0 || topK > 100) {
      throw new BadRequestException('topK must be between 1 and 100');
    }

    try {
      // Step 1: Generate query embedding
      const embeddingResult = await this.embeddingService.generateEmbedding({
        text: query,
      });

      const queryEmbedding = embeddingResult.embedding;

      // Step 2: Search in database using cosine similarity
      // Formula: 1 - (distance) gives us similarity between 0-1
      // Order by similarity descending (highest first)
      const results = await this.prisma.$queryRaw`
        SELECT
          id,
          content,
          "sourceDocumentId",
          "pageNumber",
          "chunkIndex",
          (1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector)) as similarity
        FROM "DocumentChunk"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${topK}
      `;

      // Step 3: Map results to our type
      return (
        (results as Array<{
          id: string;
          content: string;
          sourceDocumentId: string;
          pageNumber: number | null;
          chunkIndex: number | null;
          similarity: number;
        }>) || []
      ).map((r) => ({
        id: r.id,
        content: r.content,
        similarity: r.similarity,
        sourceDocumentId: r.sourceDocumentId,
        pageNumber: r.pageNumber || undefined,
        chunkIndex: r.chunkIndex || undefined,
      }));
    } catch (error) {
      throw new Error(
        `Semantic search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =====================================================
  // Delete all chunks from a document
  // =====================================================
  // Why: When updating a document, delete old version first

  async deleteDocumentChunks(sourceDocumentId: string): Promise<number> {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM "DocumentChunk"
        WHERE "sourceDocumentId" = ${sourceDocumentId}
      `;

      return result;
    } catch (error) {
      throw new Error(
        `Failed to delete chunks: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =====================================================
  // Get chunk by ID (for debugging/reference)
  // =====================================================

  async getChunkById(id: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT id, content, "sourceDocumentId", "pageNumber", "chunkIndex"
        FROM "DocumentChunk"
        WHERE id = ${id}
      `;

      return (result as Array<unknown>)[0] || null;
    } catch (error) {
      throw new Error(
        `Failed to get chunk: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =====================================================
  // Get stats: how many chunks, documents, etc
  // =====================================================
  // Why: Useful for monitoring and debugging

  async getStats() {
    try {
      const chunkCount = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "DocumentChunk"
      `;

      const docCount = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "Document"
      `;

      return {
        totalChunks: (chunkCount as Array<{ count: bigint }>)[0]?.count || 0,
        totalDocuments: (docCount as Array<{ count: bigint }>)[0]?.count || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =====================================================
  // Cleanup
  // =====================================================

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
