// Week 3 Day 3 - Vector-only vs Hybrid vs Hybrid + Reranking, retrieval-only
// (no final LLM answer generation, so this stays fast). Reuses the same
// labelled dataset as compare-hybrid.ts and the real LlmRerankerService.
// Run with: npm run compare:rerank

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { VectorController } from '../src/vectors/vector.controller';
import { VectorDbService } from '../src/vectors/vector-db.service';
import { HybridRetrievalService } from '../src/retrieval/hybrid-retrieval.service';
import { Reranker } from '../src/ai/reranking/reranker.types';
import { applyReranking } from '../src/ai/reranking/reranker';

const TENANT = 'rerank-eval';
const CANDIDATE_TOP_K = 10;
const FINAL_TOP_K = 3;
const THRESHOLD = 0.5;

const docs = [
  { title: 'Refund Policy', content: 'Customers can request a refund within 30 days of purchase from the billing page. Refund requests are reviewed within five business days by the billing team.' },
  { title: 'Support Contact', content: 'For technical issues, contact support through the help center. Support responses are typically sent within 24 hours on business days.' },
  { title: 'Invoice INV-2048', content: 'Invoice INV-2048 was issued to Acme Ltd for 4500 USD and has been overdue since March 3.' },
  { title: 'Error Codes', content: 'Error code E-4012 means the payment gateway rejected the card. Retry after verifying the billing address.' },
  { title: 'Onboarding', content: 'New employees receive a laptop and access credentials during the first week of orientation.' },
];

const cases: Array<{ id: string; label: string; query: string; expected: string | null }> = [
  { id: 'A', label: 'semantic', query: 'How long until my money comes back?', expected: 'Refund Policy' },
  { id: 'B', label: 'exact keyword (invoice id)', query: 'INV-2048', expected: 'Invoice INV-2048' },
  { id: 'C', label: 'paraphrase (no shared words)', query: 'Can I get my money returned?', expected: 'Refund Policy' },
  { id: 'D', label: 'exact term + semantic', query: 'Why was my card rejected with E-4012?', expected: 'Error Codes' },
  { id: 'E', label: 'no matching info', query: 'What is the office parking policy?', expected: null },
  { id: 'F', label: 'many weak + one strong candidate', query: 'How do I get help with a problem?', expected: 'Support Contact' },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`DELETE FROM "DocumentChunk" WHERE "tenantId" = ${TENANT}`;
    await prisma.$executeRaw`DELETE FROM "Document" WHERE "tenantId" = ${TENANT}`;

    const vc = app.get(VectorController);
    const vectorDb = app.get(VectorDbService);
    const hybrid = app.get(HybridRetrievalService);
    const reranker = app.get(Reranker);

    const titleByDocId: Record<string, string> = {};
    for (const d of docs) {
      const { documentId } = await vc.ingestDocument({ ...d, tenantId: TENANT });
      titleByDocId[documentId] = d.title;
    }

    const totals: Record<string, { hits: number; expectedCases: number; returned: number; irrelevant: number; topHits: number }> = {
      vector: { hits: 0, expectedCases: 0, returned: 0, irrelevant: 0, topHits: 0 },
      hybrid: { hits: 0, expectedCases: 0, returned: 0, irrelevant: 0, topHits: 0 },
      'hybrid+rerank': { hits: 0, expectedCases: 0, returned: 0, irrelevant: 0, topHits: 0 },
    };

    for (const c of cases) {
      console.log(`\n[${c.id}] ${c.label}: "${c.query}" (expected: ${c.expected ?? 'nothing'})`);

      const v = await vectorDb.semanticSearch(c.query, TENANT, FINAL_TOP_K, THRESHOLD);
      const h = await hybrid.search(c.query, TENANT, { finalTopK: FINAL_TOP_K, similarityThreshold: THRESHOLD });
      const candidates = await hybrid.search(c.query, TENANT, { finalTopK: CANDIDATE_TOP_K, similarityThreshold: THRESHOLD });

      const startedAt = Date.now();
      let scores: Map<string, number> | null = null;
      try {
        scores = await reranker.rerank(
          c.query,
          candidates.map((x) => ({ chunkId: x.chunkId, content: x.content })),
        );
      } catch (error) {
        console.log(`  reranker failed, falling back: ${error instanceof Error ? error.message : String(error)}`);
      }
      const latencyMs = Date.now() - startedAt;
      const { items: reranked } = applyReranking(candidates, scores, FINAL_TOP_K);

      const modes: Record<string, string[]> = {
        vector: v.map((x) => titleByDocId[x.sourceDocumentId]),
        hybrid: h.map((x) => titleByDocId[x.documentId]),
        'hybrid+rerank': reranked.map((r) => titleByDocId[r.item.documentId]),
      };

      for (const [mode, titles] of Object.entries(modes)) {
        const hit = c.expected ? titles.includes(c.expected) : false;
        const topHit = c.expected ? titles[0] === c.expected : titles.length === 0;
        const irrelevant = titles.filter((t) => t !== c.expected).length;
        const t = totals[mode];
        t.returned += titles.length;
        t.irrelevant += irrelevant;
        if (c.expected) { t.expectedCases += 1; if (hit) t.hits += 1; }
        if (topHit) t.topHits += 1;
      }

      console.log(`  vector         -> [${modes.vector.join(' | ')}]`);
      console.log(`  hybrid         -> [${modes.hybrid.join(' | ')}]`);
      console.log(
        `  hybrid+rerank  -> [${modes['hybrid+rerank'].join(' | ')}]  (rerank latency ${latencyMs}ms, candidates=${candidates.length})`,
      );
    }

    console.log(`\n--- Summary (candidateTopK=${CANDIDATE_TOP_K}, finalTopK=${FINAL_TOP_K}) ---`);
    for (const [mode, t] of Object.entries(totals)) {
      const recall = t.expectedCases ? (t.hits / t.expectedCases).toFixed(2) : 'n/a';
      const precision = t.returned ? ((t.returned - t.irrelevant) / t.returned).toFixed(2) : 'n/a';
      console.log(
        `${mode.padEnd(15)} recall=${recall} (${t.hits}/${t.expectedCases})  precision=${precision}  rank1Correct=${t.topHits}/${cases.length}`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await app.close();
  }
}

run().catch((e) => { console.error(e); process.exitCode = 1; });
