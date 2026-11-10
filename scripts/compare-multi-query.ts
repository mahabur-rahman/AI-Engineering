// Week 3 Day 4 - compare original-query retrieval with multi-query retrieval.
// Uses an isolated tenant and labelled documents; query generation/retrieval
// latency is measured, while answer generation is intentionally excluded.
// Run with: npm run compare:multi-query

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import {
  MultiQueryService,
  mergeMultiQueryResults,
} from '../src/ai/rag/multi-query.service';
import { HybridRetrievalService } from '../src/retrieval/hybrid-retrieval.service';
import { VectorController } from '../src/vectors/vector.controller';

const TENANT = 'multi-query-eval';
const CANDIDATE_TOP_K = 5;
const QUERY_COUNTS = [1, 3, 5];

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
  {
    query: 'How long until my money comes back?',
    expectedTitle: 'Refund Policy',
  },
  { query: 'Can I get my money returned?', expectedTitle: 'Refund Policy' },
  { query: 'INV-2048', expectedTitle: 'Invoice INV-2048' },
  { query: 'Why did E-4012 reject my payment?', expectedTitle: 'Error Codes' },
  {
    query: 'How do I get help with a technical problem?',
    expectedTitle: 'Support Contact',
  },
  { query: 'What is the office parking policy?', expectedTitle: null },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });
  const prisma = new PrismaClient();

  try {
    await prisma.$executeRaw`DELETE FROM "DocumentChunk" WHERE "tenantId" = ${TENANT}`;
    await prisma.$executeRaw`DELETE FROM "Document" WHERE "tenantId" = ${TENANT}`;

    const vectorController = app.get(VectorController);
    const retrieval = app.get(HybridRetrievalService);
    const queryGenerator = app.get(MultiQueryService);
    const titleByDocumentId: Record<string, string> = {};

    for (const document of docs) {
      const seeded = await vectorController.ingestDocument({
        ...document,
        tenantId: TENANT,
      });
      titleByDocumentId[seeded.documentId] = document.title;
    }

    for (const queryCount of QUERY_COUNTS) {
      let relevantHits = 0;
      let relevantCases = 0;
      let returned = 0;
      let relevantReturned = 0;
      let totalLatencyMs = 0;

      console.log(
        `\n=== queryCount=${queryCount} (includes original query) ===`,
      );
      for (const testCase of cases) {
        const startedAt = Date.now();
        const expanded = await queryGenerator.generateQueries(
          testCase.query,
          queryCount,
        );
        const resultSets = await Promise.all(
          expanded.queries.map((query) =>
            retrieval.search(query, TENANT, {
              finalTopK: CANDIDATE_TOP_K,
              similarityThreshold: 0.45,
            }),
          ),
        );
        const results = mergeMultiQueryResults(resultSets, CANDIDATE_TOP_K);
        const latencyMs = Date.now() - startedAt;
        totalLatencyMs += latencyMs;

        const titles = results.map(
          (result) => titleByDocumentId[result.documentId],
        );
        const hit = testCase.expectedTitle
          ? titles.includes(testCase.expectedTitle)
          : false;
        const relevantCount = titles.filter(
          (title) => title === testCase.expectedTitle,
        ).length;
        const status = testCase.expectedTitle
          ? hit
            ? 'HIT'
            : 'MISS'
          : titles.length === 0
            ? 'EMPTY'
            : 'NOISE';
        if (testCase.expectedTitle) {
          relevantCases += 1;
          if (hit) relevantHits += 1;
        }
        returned += titles.length;
        relevantReturned += relevantCount;

        console.log(
          `${status} ${testCase.query} -> ` +
            `[${titles.join(' | ')}] (${expanded.queries.length} queries, ${latencyMs}ms${expanded.usedFallback ? ', generation fallback' : ''})`,
        );
      }

      const recall = relevantCases ? relevantHits / relevantCases : 0;
      const precision = returned ? relevantReturned / returned : 0;
      console.log(
        `summary: recall=${recall.toFixed(2)} (${relevantHits}/${relevantCases}), ` +
          `precision=${precision.toFixed(2)}, meanLatency=${Math.round(totalLatencyMs / cases.length)}ms`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await app.close();
  }
}

run().catch((error) => {
  console.error('Multi-query comparison failed:', error);
  process.exitCode = 1;
});
