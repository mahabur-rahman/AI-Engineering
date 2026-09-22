// Week 3 Day 2 - Vector-only vs Keyword-only vs Hybrid, on a small labelled dataset.
// Seeds an isolated tenant (cleared each run), runs 8 query types, prints per-mode results
// with hit / precision / noise. No LLM involved (embedding only).
// Run with: npm run compare:hybrid

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { VectorController } from '../src/vectors/vector.controller';
import { VectorDbService } from '../src/vectors/vector-db.service';
import { KeywordRetrievalService } from '../src/retrieval/keyword-retrieval.service';
import { HybridRetrievalService } from '../src/retrieval/hybrid-retrieval.service';

const TENANT = 'hybrid-eval';
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
  { id: 'F', label: 'overlap (both should hit)', query: 'refund request billing page', expected: 'Refund Policy' },
  { id: 'G', label: 'vector finds, keyword should not', query: 'Is it possible to be reimbursed?', expected: 'Refund Policy' },
  { id: 'H', label: 'keyword finds, vector may not', query: 'E-4012', expected: 'Error Codes' },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`DELETE FROM "DocumentChunk" WHERE "tenantId" = ${TENANT}`;
    await prisma.$executeRaw`DELETE FROM "Document" WHERE "tenantId" = ${TENANT}`;

    const vc = app.get(VectorController);
    const vectorDb = app.get(VectorDbService);
    const keyword = app.get(KeywordRetrievalService);
    const hybrid = app.get(HybridRetrievalService);

    const titleById: Record<string, string> = {};
    for (const d of docs) {
      const { documentId } = await vc.ingestDocument({ ...d, tenantId: TENANT });
      titleById[documentId] = d.title;
    }

    const totals: Record<string, { hits: number; expectedCases: number; returned: number; irrelevant: number; noisyEmpty: number }> = {
      vector: { hits: 0, expectedCases: 0, returned: 0, irrelevant: 0, noisyEmpty: 0 },
      keyword: { hits: 0, expectedCases: 0, returned: 0, irrelevant: 0, noisyEmpty: 0 },
      hybrid: { hits: 0, expectedCases: 0, returned: 0, irrelevant: 0, noisyEmpty: 0 },
    };

    for (const c of cases) {
      console.log(`\n[${c.id}] ${c.label}: "${c.query}"  (expected: ${c.expected ?? 'nothing'})`);
      const [v, k, h] = await Promise.all([
        vectorDb.semanticSearch(c.query, TENANT, FINAL_TOP_K, THRESHOLD),
        keyword.search(c.query, TENANT, FINAL_TOP_K),
        hybrid.search(c.query, TENANT, { finalTopK: FINAL_TOP_K, similarityThreshold: THRESHOLD }),
      ]);
      const modes: Record<string, string[]> = {
        vector: v.map((x) => titleById[x.sourceDocumentId]),
        keyword: k.map((x) => titleById[x.sourceDocumentId]),
        hybrid: h.map((x) => titleById[x.documentId]),
      };
      for (const [mode, titles] of Object.entries(modes)) {
        const hit = c.expected ? titles.includes(c.expected) : false;
        const irrelevant = titles.filter((t) => t !== c.expected).length;
        const t = totals[mode];
        t.returned += titles.length;
        t.irrelevant += irrelevant;
        if (c.expected) { t.expectedCases += 1; if (hit) t.hits += 1; }
        else if (titles.length > 0) t.noisyEmpty += 1;
        console.log(`  ${mode.padEnd(8)} -> [${titles.join(' | ')}] ${c.expected ? (hit ? 'HIT' : 'MISS') : titles.length ? 'NOISE' : 'OK(empty)'}`);
      }
    }

    console.log('\n--- Summary (finalTopK=' + FINAL_TOP_K + ', vector threshold=' + THRESHOLD + ') ---');
    for (const [mode, t] of Object.entries(totals)) {
      const recall = t.expectedCases ? (t.hits / t.expectedCases).toFixed(2) : 'n/a';
      const precision = t.returned ? ((t.returned - t.irrelevant) / t.returned).toFixed(2) : 'n/a';
      console.log(`${mode.padEnd(8)} recall=${recall} (${t.hits}/${t.expectedCases})  precision=${precision}  irrelevantReturned=${t.irrelevant}  noiseOnNoAnswer=${t.noisyEmpty}`);
    }
  } finally {
    await prisma.$disconnect();
    await app.close();
  }
}

run().catch((e) => { console.error(e); process.exitCode = 1; });
