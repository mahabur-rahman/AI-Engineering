// Week 3 Day 2 - Keyword (lexical) retrieval.
// Uses PostgreSQL full-text search (tsvector/tsquery + ts_rank_cd), NOT true BM25:
// native PostgreSQL has no BM25. BM25 would need an engine such as
// Elasticsearch/OpenSearch (or a Postgres BM25 extension) behind this same service.

import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { KeywordResult, RetrievalFilters } from './retrieval.types';

const FTS_CONFIG = 'english';

@Injectable()
export class KeywordRetrievalService implements OnModuleDestroy {
  private readonly prisma = new PrismaClient();

  async search(
    query: string,
    tenantId: string,
    topK: number,
    minScore = 0,
    filters: RetrievalFilters = {},
  ): Promise<KeywordResult[]> {
    if (!query?.trim()) {
      throw new BadRequestException('Query cannot be empty');
    }
    if (!tenantId?.trim()) {
      throw new BadRequestException('Tenant ID cannot be empty');
    }
    if (!Number.isInteger(topK) || topK < 1 || topK > 100) {
      throw new BadRequestException('keyword topK must be between 1 and 100');
    }

    const documentId = filters.sourceDocumentId ?? null;

    // plainto_tsquery ANDs the terms; swapping & for | gives OR semantics so a
    // natural-language question still matches on any content word. ts_rank_cd
    // then orders chunks by how many/how close the matched terms are.
    // A query made only of stop words yields an empty tsquery and matches nothing.
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        sourceDocumentId: string;
        tenantId: string;
        pageNumber: number | null;
        chunkIndex: number | null;
        score: number;
      }>
    >`
      WITH q AS (
        SELECT to_tsquery(${FTS_CONFIG}::regconfig,
          replace(plainto_tsquery(${FTS_CONFIG}::regconfig, ${query})::text, '&', '|')) AS tsq
      )
      SELECT c.id, c.content, c."sourceDocumentId", c."tenantId",
             c."pageNumber", c."chunkIndex",
             ts_rank_cd(to_tsvector(${FTS_CONFIG}::regconfig, c.content), q.tsq) AS score
      FROM "DocumentChunk" c, q
      WHERE c."tenantId" = ${tenantId}
        AND (${documentId}::text IS NULL OR c."sourceDocumentId" = ${documentId})
        AND to_tsvector(${FTS_CONFIG}::regconfig, c.content) @@ q.tsq
        AND ts_rank_cd(to_tsvector(${FTS_CONFIG}::regconfig, c.content), q.tsq) >= ${minScore}
      ORDER BY score DESC, c.id ASC
      LIMIT ${topK}
    `;

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      keywordScore: Number(row.score),
      sourceDocumentId: row.sourceDocumentId,
      tenantId: row.tenantId,
      pageNumber: row.pageNumber ?? undefined,
      chunkIndex: row.chunkIndex ?? undefined,
    }));
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
