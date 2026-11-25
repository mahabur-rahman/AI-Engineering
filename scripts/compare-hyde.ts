// Week 3 Day 5 retrieval evaluation. Uses a unique tenant and removes only its own seed data.
// Run with: npm run compare:hyde
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { VectorController } from '../src/vectors/vector.controller';
import { VectorDbService } from '../src/vectors/vector-db.service';
import { HybridRetrievalService } from '../src/retrieval/hybrid-retrieval.service';
import type { HybridResult } from '../src/retrieval/retrieval.types';
import {
  MultiQueryService,
  mergeMultiQueryResults,
} from '../src/ai/rag/multi-query.service';
import { HyDEService } from '../src/ai/rag/hyde.service';
import { Reranker } from '../src/ai/reranking/reranker.types';
import { applyReranking } from '../src/ai/reranking/reranker';

const TENANT = `hyde-eval-${Date.now()}`;
const TOP_K = 5;
const docs = [
  {
    title: 'Refund Policy',
    content:
      'Customers may request reimbursement within 30 days from the billing page. The finance team reviews refund requests within five business days.',
  },
  {
    title: 'Support Contact',
    content:
      'For technical problems, contact customer support through the help center. Support usually replies within 24 business hours.',
  },
  {
    title: 'Invoice INV-2048',
    content:
      'Invoice INV-2048 was issued to Acme Ltd for 4500 USD and has been overdue since March 3.',
  },
  {
    title: 'Error Codes',
    content:
      'Error code E-4012 means the payment gateway declined the card. Verify the billing address before retrying.',
  },
  {
    title: 'Onboarding',
    content:
      'New employees receive a laptop and account credentials during their first week of orientation.',
  },
];
const cases = [
  { query: 'How long until my money comes back?', relevant: 'Refund Policy' },
  { query: 'Can I get my money returned?', relevant: 'Refund Policy' },
  { query: 'INV-2048', relevant: 'Invoice INV-2048' },
  { query: 'Why did E-4012 reject my payment?', relevant: 'Error Codes' },
  {
    query: 'How do I get help with a technical problem?',
    relevant: 'Support Contact',
  },
  { query: 'What is the office parking policy?', relevant: null },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });
  const prisma = new PrismaClient();
  try {
    const ingest = app.get<VectorController>(VectorController);
    const vector = app.get<VectorDbService>(VectorDbService);
    const hybrid = app.get<HybridRetrievalService>(HybridRetrievalService);
    const multiQuery = app.get<MultiQueryService>(MultiQueryService);
    const hyde = app.get<HyDEService>(HyDEService);
    const reranker = app.get<Reranker>(Reranker);
    const titleByDocumentId: Record<string, string> = {};
    for (const doc of docs) {
      const saved = await ingest.ingestDocument({ ...doc, tenantId: TENANT });
      titleByDocumentId[saved.documentId] = doc.title;
    }

    for (const mode of [
      'traditional-vector',
      'multi-query-hybrid',
      'hyde-hybrid',
      'hyde-hybrid-reranked',
    ] as const) {
      let relevantHits = 0,
        relevantCases = 0,
        returned = 0,
        relevantReturned = 0,
        noiseCases = 0,
        latency = 0;
      console.log(`\n=== ${mode} ===`);
      for (const test of cases) {
        const started = Date.now();
        let results: HybridResult[];
        if (mode === 'traditional-vector') {
          const result = await vector.semanticSearch(
            test.query,
            TENANT,
            TOP_K,
            0.45,
          );
          results = result.map((r, i) => ({
            chunkId: r.id,
            documentId: r.sourceDocumentId,
            content: r.content,
            vectorScore: r.similarity,
            vectorRank: i + 1,
            fusedScore: r.similarity,
            tenantId: r.tenantId,
          }));
        } else if (mode === 'multi-query-hybrid') {
          const expanded = await multiQuery.generateQueries(test.query, 3);
          const sets = await Promise.all(
            expanded.queries.map((q) =>
              hybrid.search(q, TENANT, {
                finalTopK: TOP_K,
                similarityThreshold: 0.45,
              }),
            ),
          );
          results = mergeMultiQueryResults(sets, TOP_K);
        } else {
          const [hydeEmbedding, expanded] = await Promise.all([
            hyde.createRetrievalEmbedding(test.query),
            multiQuery.generateQueries(test.query, 3),
          ]);
          const [hydeHits, ...querySets] = await Promise.all([
            hybrid.searchWithEmbedding(
              test.query,
              TENANT,
              hydeEmbedding.embedding,
              { finalTopK: TOP_K, similarityThreshold: 0.45 },
            ),
            ...expanded.queries.map((q) =>
              hybrid.search(q, TENANT, {
                finalTopK: TOP_K,
                similarityThreshold: 0.45,
              }),
            ),
          ]);
          results = mergeMultiQueryResults([hydeHits, ...querySets], TOP_K);
          if (mode === 'hyde-hybrid-reranked' && results.length) {
            const scores = await reranker.rerank(
              test.query,
              results.map((r) => ({ chunkId: r.chunkId, content: r.content })),
            );
            results = applyReranking(results, scores, TOP_K).items.map(
              (entry) => entry.item,
            );
          }
        }
        const elapsed = Date.now() - started;
        latency += elapsed;
        const titles = results
          .map((r) => titleByDocumentId[r.documentId])
          .filter(Boolean);
        const relevantCount = test.relevant
          ? titles.filter((title) => title === test.relevant).length
          : 0;
        if (test.relevant) {
          relevantCases++;
          if (relevantCount > 0) relevantHits++;
        } else if (titles.length) noiseCases++;
        returned += titles.length;
        relevantReturned += relevantCount;
        console.log(
          `${test.relevant ? (titles.includes(test.relevant) ? 'HIT' : 'MISS') : titles.length ? 'NOISE' : 'EMPTY'} ${test.query} -> ${titles.join(' | ') || '(none)'} (${elapsed}ms)`,
        );
      }
      console.log(
        `recall@${TOP_K}=${(relevantHits / (relevantCases || 1)).toFixed(2)} precision=${(relevantReturned / (returned || 1)).toFixed(2)} no-answer-noise=${noiseCases}/${cases.length - relevantCases} mean-latency=${Math.round(latency / cases.length)}ms`,
      );
    }
    console.log(`Evaluation tenant: ${TENANT}`);
  } finally {
    await prisma.$executeRaw`DELETE FROM "DocumentChunk" WHERE "tenantId" = ${TENANT}`;
    await prisma.$executeRaw`DELETE FROM "Document" WHERE "tenantId" = ${TENANT}`;
    await prisma.$disconnect();
    await app.close();
  }
}
run().catch((error) => {
  console.error('HyDE comparison failed:', error);
  process.exitCode = 1;
});
