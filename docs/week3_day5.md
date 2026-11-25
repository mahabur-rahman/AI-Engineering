# Week 3 — Day 5

## HyDE (Hypothetical Document Embeddings)

আজকের লক্ষ্য হলো কীভাবে LLM দিয়ে একটি hypothetical answer/document তৈরি করে সেটিকে embed করে আরও relevant real documents retrieve করা যায় তা বোঝা।

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0; paid API নয়
- Stack: NestJS, TypeScript, PostgreSQL + pgvector, Ollama, Prisma
- Existing retrieval: vector search, PostgreSQL full-text keyword search, RRF hybrid fusion
- Existing RAG flow: `/ask` → multi-query retrieval → candidate merge → reranking → context construction → Ollama answer
- Existing local embedding model: `nomic-embed-text`
- Existing local generation model: configured through `OLLAMA_MODEL`
- Project: AI Business Copilot

---

## Must-Learn Concepts

### A. HyDE Fundamentals

1. What is HyDE?
2. Why HyDE is used in RAG
3. Limitations of traditional query embedding
4. Hypothetical Document কী?
5. Query Embedding বনাম Hypothetical Document Embedding
6. How HyDE works

### B. HyDE Pipeline

7. User Query
8. Hypothetical Document Generation
9. Hypothetical Document Embedding
10. Vector Search
11. Retrieved Real Documents
12. Context Construction
13. Final Answer Generation

### C. HyDE বনাম Traditional Retrieval

14. Traditional Vector Retrieval বনাম HyDE
15. Query-to-Document Matching
16. Semantic Gap
17. Why hypothetical documents can improve retrieval
18. HyDE বনাম Query Expansion
19. HyDE বনাম Multi-Query Retrieval

### D. Benefits and Limitations

20. Retrieval Recall improvement
21. Domain-specific retrieval
22. Hypothetical Document Hallucination
23. Why HyDE does not guarantee correctness
24. Retrieval Noise
25. When HyDE performs poorly
26. Latency and token cost

### E. RAG Integration

27. HyDE + Vector Search
28. HyDE + Hybrid Search
29. HyDE + Reranking
30. HyDE + Multi-Query Retrieval
31. Fallback to original query
32. Complete HyDE RAG Architecture

---

## Top 5 Interview Questions

প্রশ্নগুলো একবারে একটি করে আলোচনা হবে। ব্যবহারকারী `next` বললে পরের unanswered প্রশ্ন দেওয়া হবে।

1. What is HyDE and how does it work in RAG?
2. Why does HyDE generate a hypothetical document instead of directly embedding the user query?
3. What is the difference between Traditional Vector Retrieval, Query Expansion, Multi-Query Retrieval, and HyDE?
4. What are the benefits and limitations of HyDE?
5. How would you integrate HyDE with Hybrid Search and Reranking in a production RAG pipeline?

উত্তরের ধরন: সংক্ষিপ্ত বাংলা ব্যাখ্যা, ছোট technical example, interview-ready answer, এবং প্রাসঙ্গিক হলে Interview Trap।

---

## Coding Part — Implementation Status

**Implementation: complete; automated verification: recorded below; manual quality evaluation: pending user run.** Existing retrieval, hybrid fusion, reranker, and grounded RAG generation reuse করা হয়েছে।

### Target Architecture

```text
User Query
    ↓
HyDE Service
    ↓
LLM generates Hypothetical Document
    ↓
Generate Embedding
    ↓
Vector / Hybrid Retrieval
    ↓
Candidate Results
    ↓
Existing Reranker
    ↓
Final Top-K
    ↓
Context Construction
    ↓
LLM Answer Generation
```

### Implementation Requirements

1. Create `HyDEService`.
2. Generate hypothetical documents using the existing local LLM.
3. Embed the hypothetical document.
4. Reuse existing vector retrieval.
5. Support hybrid search integration.
6. Reuse the existing reranker.
7. Preserve the original user query for final answer generation and reranking.
8. Make HyDE configurable on/off.
9. Handle empty hypothetical documents.
10. Handle LLM timeout and failure.
11. Fall back to retrieval using the original query/embedding.
12. Add useful logging and error handling without logging sensitive content.

### Testing Requirements

- Normal query
- Short query
- Ambiguous query
- Empty hypothetical document
- LLM generation failure
- LLM timeout
- Embedding failure
- No retrieval results
- Reranker failure
- HyDE enabled versus disabled comparison

### Evaluation

Compare:

| Approach              | Evaluate                                        |
| --------------------- | ----------------------------------------------- |
| Traditional Retrieval | Baseline recall and relevance                   |
| Multi-Query Retrieval | Recall and latency                              |
| HyDE Retrieval        | Recall, relevance, retrieval noise, and latency |

HyDE যে সব query-তে retrieval improve করবে এমন দাবি করা যাবে না; observed results লিখতে হবে।

---

## Implemented Design

```text
/ask (useHyde=true or HYDE_ENABLED=true)
  ├─ MultiQueryService → original + query variants → normal HybridRetrievalService
  └─ HyDEService → configured Ollama LLM → hypothetical text → existing EmbeddingService
       → HybridRetrievalService.searchWithEmbedding
            ├─ vector search: hypothetical embedding
            └─ PostgreSQL keyword search: original question
  → RRF merge/deduplicate → existing Reranker (original question)
  → real retrieved chunks only → grounded answer generation (original question)
```

- `HyDEService` returns the retrieval embedding and safe status metadata only. Hypothetical text/vector is not exposed by the API and never becomes context or a citation.
- Multi-Query remains active and its result sets are fused with HyDE results. `queryCount: 1` uses only the original query for the non-HyDE retrieval branch.
- Request `useHyde` overrides `HYDE_ENABLED`; the default is disabled unless `HYDE_ENABLED=true`.
- `HYDE_NUM_PREDICT` accepts 32–512 (default 180); `HYDE_TIMEOUT_MS` accepts 1,000–60,000 ms (default 15,000). LLM and embedding model use existing `OLLAMA_MODEL` and `EMBEDDING_MODEL` configuration.
- Empty/oversized output, LLM failure/timeout, or hypothetical embedding failure falls back to original-query embedding. If that also fails, API returns controlled 503. HyDE retrieval errors are logged; successful regular retrieval can continue. Existing hybrid partial failure and reranker fallback remain.
- `/ask` adds retrieval strategy and fallback metadata without exposing hypothetical content or vectors.

## API and Manual Terminal Guide

Prerequisites: `.env.local` has valid `DATABASE_URL`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `EMBEDDING_MODEL`; Ollama is installed locally.

### Start and check services

```bash
docker compose up -d postgres
docker compose ps
```

If Ollama is not already running, start it in its own terminal and leave that terminal open:

```bash
ollama serve
```

In a separate terminal, confirm Ollama and start the API:

```bash
ollama list
curl -s http://127.0.0.1:11434/api/tags
npm run start:dev
```

Run Ollama and the backend in separate terminals when they are not already running. Confirm `ollama list` includes the models configured in `.env.local`. Then check:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/vectors/health
curl -i http://localhost:3000/vectors/models
```

Expected: HTTP 200; health reports `status: healthy`, `ollamaRunning: true`, and database counts; models reports the available embedding model.

### Seed a test tenant

```bash
export TENANT_ID="hyde-manual-$(date +%s)"
curl -i -X POST http://localhost:3000/vectors/ingest \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Refund policy test\",\"tenantId\":\"$TENANT_ID\",\"content\":\"Customers may request a refund within 30 days from the billing page. Refund requests are reviewed within five business days.\"}"
```

Expected HTTP 201 with `documentId`, `chunkCount`, and success `message`. Keep this shell open so `$TENANT_ID` remains set.

### Compare HyDE off and on

Traditional existing Multi-Query + Hybrid path:

```bash
curl -i -X POST http://localhost:3000/ask \
  -H 'Content-Type: application/json' \
  -d "{\"question\":\"When should I expect my money back after asking for reimbursement?\",\"tenantId\":\"$TENANT_ID\",\"queryCount\":1,\"candidateTopK\":10,\"topK\":3,\"useHyde\":false}"
```

HyDE + Hybrid + current Multi-Query path:

```bash
curl -i -X POST http://localhost:3000/ask \
  -H 'Content-Type: application/json' \
  -d "{\"question\":\"When should I expect my money back after asking for reimbursement?\",\"tenantId\":\"$TENANT_ID\",\"queryCount\":1,\"candidateTopK\":10,\"topK\":3,\"useHyde\":true}"
```

Expected HTTP 201 with `answer`, `sources`, and `retrieval`. `retrieval.strategy` identifies the path; `retrieval.hydeFallback` and optional reason show original-embedding fallback. Sources are real stored chunks. No retrieved context yields the existing “I do not know…” answer and empty sources. No internal embedding or hypothetical document is returned.

Try other `question` values with the same tenant: short (`Refunds?`), ambiguous (`What is the limit?`), technical (`Which payment gateway error requires checking the billing address?`), unsupported (`What is the office parking policy?`). Inspect retrieved sources and grounded answer; do not assume HyDE improves every case.

### Fallback checks

- LLM failure: temporarily set `OLLAMA_MODEL` in `.env.local` to an unavailable model and restart. Use a fresh tenant with no ingested documents and call `/ask` with `useHyde:true`; it returns the no-context response with `retrieval.hydeFallback:true` and `generation_failure` (no final-answer generation is needed). Restore the model immediately. For timeout, temporarily lower `HYDE_TIMEOUT_MS` to `1000`; a slow local model may hit the timeout and take the same original-query embedding fallback.
- Empty model output, embedding failure/dimension mismatch, and reranker failure are isolated in unit tests; the API intentionally has no unsafe switch to force malformed output.
- To check controlled embedding failure, temporarily set `EMBEDDING_MODEL` to an unavailable model, restart and call `/ask` with HyDE enabled. If both HyDE and original query embeddings fail, expect HTTP 503. Restore the configured model.
- No results is a normal response, not an error. Reranker failure uses existing retrieval ordering; its isolated mocked behavior is tested. A broken LLM can also break final answer generation, so mocks are the reliable isolated reranker check.

### Evaluation, logs, and verification commands

```bash
npm run compare:hyde
```

This seeds and deletes only a unique `hyde-eval-<timestamp>` tenant. It compares Traditional Vector, Multi-Query Hybrid, HyDE Hybrid, and HyDE Hybrid + Reranking; prints Recall@5, precision, unsupported-query noise, and mean latency. PostgreSQL and Ollama must be running. Results depend on local models and are not claimed until the user runs it. Application logs report stage, latency, counts, fallback reason, and error type without question or hypothetical text.

```bash
npx jest --runInBand --passWithNoTests --runTestsByPath src/ai/rag/rag.service.spec.ts src/ai/rag/hyde.service.spec.ts src/retrieval/hybrid-retrieval.service.spec.ts
npm run test:e2e -- --runInBand
npx tsc --noEmit
npx eslint 'src/**/*.ts' 'scripts/**/*.ts'
npm run build
```

### Verification status

- Focused Jest: 3 suites passed, 38 tests passed (includes fallback, timeout, invalid/empty output, embedding dimensions, hybrid query split, reranker fallback, and grounded answer path).
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Scoped ESLint on all changed TypeScript files: passed.
- Full repository ESLint was attempted and reports existing formatting/type lint errors in unrelated files, including prior compare scripts and source modules; no broad cleanup was applied.
- `npm run test:e2e -- --runInBand`: exited successfully with “No tests found” (there is no existing e2e test in its configured directory).
- Manual API tests run on 2026-11-25: `/vectors/models` reported `nomic-embed-text:latest`; ingestion returned HTTP 201 with one chunk; `/vectors/search` returned the refund-policy text with similarity 0.815.
- Baseline `/ask` with `useHyde:false` answered “It takes 5 business days to review a refund request.” HyDE `/ask` initially hit the 15-second generation timeout and fell back; after setting `HYDE_TIMEOUT_MS=60000` in local `.env.local` and restarting, it returned `hydeFallback:false`, embedded the hypothetical document, retrieved the real policy chunk, and returned the same grounded answer. The captured generation stage took about 23 seconds and reranking about 8 seconds.
- Unsupported parking query with HyDE returned “I do not know…”; at threshold 0.5 one low-similarity unrelated source (0.507) was retrieved, and at threshold 0.6 it returned `sources: []`. This records retrieval noise and the no-result behavior without claiming HyDE improved quality.
- `npm run compare:hyde` aggregate evaluation has not been run. Recall/precision/noise/latency comparison remains pending; no aggregate quality claim is made.

## Documentation Synchronization

| File                                    | Action                       | Purpose                                                 |
| --------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `docs/AI_Engineering_6Month_Roadmap.md` | Linked to this Day 5 record  | One authoritative roadmap overview                      |
| `docs/week3_day5.md`                    | Updated in place             | Implementation, configuration, manual guide, evaluation |
| `.env.example`                          | Added HyDE defaults          | Document supported settings without local secrets       |
| `package.json`                          | Added `compare:hyde` command | Local retrieval comparison                              |

## Known Limitations and Completion

HyDE adds a local LLM generation and embedding call, so it increases latency and CPU/RAM use. Hypothetical wording can add retrieval noise and is never evidence. The request combines HyDE with existing Multi-Query retrieval, which costs more than standalone HyDE; `queryCount:1` limits non-HyDE query expansion. The evaluation corpus is small and does not establish general quality.

**Coding is in scope and implemented. Do not mark the whole Day 5 complete until the user runs the live comparison/manual evaluation and records observed results.**

## Out of Scope

- Agentic RAG
- Knowledge Graph RAG
- Fine-tuning
- ColBERT
- Late Interaction
- Advanced Query Routing
- Paid APIs
- Large GPU-only models

---

## Today's Workflow

```text
Concept Reading
      ↓
Top 5 Interview Q&A (one by one, user says `next`)
      ↓
User explicitly starts coding
      ↓
Implementation and tests
      ↓
Evaluation
      ↓
Week 3 Day 5 Complete
```

**Important:** Concepts, Top 5 Q&A, coding, testing, এবং evaluation সম্পূর্ণ না হওয়া পর্যন্ত Day 5 complete mark করা হবে না।
