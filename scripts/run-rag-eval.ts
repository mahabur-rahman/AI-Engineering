// Week 2 Day 7 - RAG Evaluation Runner
// What: Seeds a small isolated dataset, runs every eval question through the
//       real /ask flow (live Ollama + pgvector), scores each answer, prints
//       a summary.
// Why: This is the "Evaluation Dataset -> RAG API -> Quality Checks ->
//      Summary" workflow from docs/week2_day7.md, meant to be re-run after
//      any prompt/chunking/retrieval change (regression testing).
//
// Run with: npm run eval:rag

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VectorController } from '../src/vectors/vector.controller';
import { RagService } from '../src/ai/rag/rag.service';
import {
  evalDataset,
  evalSeedDocuments,
  EVAL_TENANT_ID,
} from '../src/ai/rag/evaluation/eval-dataset';
import {
  evaluateCase,
  summarizeResults,
  type EvalResult,
} from '../src/ai/rag/evaluation/rag-evaluator';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });

  try {
    const vectorController = app.get(VectorController);
    const ragService = app.get(RagService);

    console.log(
      `Seeding ${evalSeedDocuments.length} document(s) for tenant "${EVAL_TENANT_ID}"...\n`,
    );

    const titleByDocumentId: Record<string, string> = {};
    for (const doc of evalSeedDocuments) {
      const seeded = await vectorController.ingestDocument({
        title: doc.title,
        content: doc.content,
        tenantId: doc.tenantId,
      });
      titleByDocumentId[seeded.documentId] = doc.title;
    }

    console.log(`Running ${evalDataset.length} evaluation case(s)...\n`);

    const results: EvalResult[] = [];
    for (const evalCase of evalDataset) {
      const response = await ragService.ask({
        question: evalCase.question,
        tenantId: evalCase.tenantId,
      });
      const result = evaluateCase(evalCase, response, titleByDocumentId);
      results.push(result);

      console.log(`[${result.pass ? 'PASS' : 'FAIL'}] ${result.id} (${result.category})`);
      console.log(`  Q: ${result.question}`);
      console.log(`  A: ${result.answer}`);
      console.log(
        `  retrievedChunks=${result.retrievedChunks} relevantContext=${result.relevantContext} ` +
          `grounded=${result.grounded} answerRelevant=${result.answerRelevant} hallucination=${result.hallucination}`,
      );
      if (result.notes.length > 0) {
        console.log(`  notes: ${result.notes.join('; ')}`);
      }
      console.log('');
    }

    const summary = summarizeResults(results);
    console.log('--- Evaluation Summary ---');
    console.log(
      `${summary.passed}/${summary.total} passed (${summary.passRate}%), ` +
        `${summary.hallucinations} hallucination(s) detected`,
    );

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error('Evaluation run failed:', error);
  process.exitCode = 1;
});
