// Week 3 Day 1 - compares Top-K only (threshold 0) vs Top-K + similarity threshold.
// Metric: pgvector `<=>` = cosine distance (lower = closer); score = 1 - distance
// (higher = closer). The threshold is applied to the score inside SQL.
// Run with: npm run compare:retrieval

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VectorController } from '../src/vectors/vector.controller';
import {
  evalSeedDocuments,
  EVAL_TENANT_ID,
} from '../src/ai/rag/evaluation/eval-dataset';

const queries = [
  { label: 'highly relevant', q: 'How many days do I have to request a refund?' },
  { label: 'partially relevant', q: 'How long does a refund take?' },
  { label: 'irrelevant', q: 'What is your office parking policy?' },
  { label: 'ambiguous', q: 'How do I get help?' },
  { label: 'no matching doc', q: 'Do you offer international shipping?' },
];
const topKs = [1, 5];
const thresholds = [0, 0.5, 0.7];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });
  try {
    const vc = app.get(VectorController);
    for (const doc of evalSeedDocuments) {
      await vc.ingestDocument({ ...doc });
    }

    for (const { label, q } of queries) {
      console.log(`\n[${label}] ${q}`);
      for (const topK of topKs) {
        for (const similarityThreshold of thresholds) {
          const r = await vc.semanticSearch({
            query: q,
            tenantId: EVAL_TENANT_ID,
            topK,
            similarityThreshold,
          });
          const scores = r.results.map((x) => x.score.toFixed(3)).join(', ');
          console.log(
            `  topK=${topK} threshold=${similarityThreshold} -> ${r.totalResults} chunk(s) [${scores}]${r.noRelevantContext ? ' NO_RELEVANT_CONTEXT' : ''}`,
          );
        }
      }
    }
  } finally {
    await app.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
