# Week 3 — Day 6

## Parent-Document Retrieval & Small-to-Big Retrieval

**আজকের লক্ষ্য:** ছোট child chunk দিয়ে সুনির্দিষ্টভাবে relevant তথ্য খুঁজে, তারপর সেই child-এর parent document বা সীমিত surrounding context answer generation-এ দেওয়া। Parent context-ও source document-এরই অংশ হবে; retrieved child/parent বাস্তব stored data, generated text নয়।

**Status: planning and architecture inspection complete; concepts, interview Q&A, implementation, tests, and live evaluation pending.** এই দিন coding শুরু হবে concepts ও পাঁচটি interview Q&A শেষ করে user coding শুরু করতে বলার পর।

## Repository Inspection: Existing Design

- Stack: NestJS + TypeScript, Prisma, PostgreSQL/pgvector, local Ollama. `nomic-embed-text` produces 768-dimensional vectors.
- `Document` table-এ `id`, `title`, `source`, `tenantId`, `language`, `isActive`, `metadata`, timestamps আছে; full document `content` field নেই।
- `DocumentChunk`-এ `content`, `embedding`, `sourceDocumentId`, `tenantId`, `pageNumber`, `chunkIndex`, `metadata`, timestamps আছে। `sourceDocumentId` index করা, কিন্তু Prisma schema-তে এখনো `Document`-এর foreign-key relation নেই। Existing `sourceDocumentId`-ই child থেকে document-এ যাওয়ার equivalent key; নতুন redundant `parentId` যোগ করার আগে সেটি reuse করা হবে কি না যাচাই করতে হবে।
- Ingestion endpoint `POST /vectors/ingest` text clean করে existing `smartChunkDocument` দিয়ে child chunks বানায়, প্রতিটি child embed করে, পরে `Document` ও chunk insert করে। Offset `startChar`/`endChar` child metadata-তে রাখা হয়। Storage পুরো operation transaction-এ নেই; Day 6-এ failure atomicity পরীক্ষা করতে হবে।
- Existing chunker semantic paragraph grouping চেষ্টা করে; default max chunk size 512 characters. Fixed-size ও hybrid helpers-ও আছে। Existing strategy অকারণে replace করা হবে না।
- `HybridRetrievalService` child chunks-এর vector ও PostgreSQL keyword results RRF দিয়ে merge করে। `/ask` candidates-এ reranker প্রয়োগ করে, এরপর `buildRetrievedContext` বর্তমানে retrieved child content-ই context-এ রাখে।
- `VectorDbService.deleteDocumentChunks` child rows মুছে, কিন্তু Document বা re-index flow পরিচালনা করে না। Existing document data অক্ষত রেখে update semantics নির্ধারণ করা দরকার।
- Repository-তে আলাদা authoritative database/API/testing guide পাওয়া যায়নি; Day 6-এর implementation details এই file-এ থাকবে, roadmap-এ শুধু link থাকবে।
- Prisma migration history checked-in আছে কি না এবং live DB-তে orphan chunk আছে কি না migration design-এর আগে যাচাই করতে হবে। কোনো row অনুমান করে মুছে ফেলা যাবে না।

## Must-Learn Concepts

### A. Chunk Retrieval Limitations

1. Small Chunk Retrieval কী?
2. ছোট chunks-এর সুবিধা ও সীমাবদ্ধতা
3. Context Fragmentation কী?
4. Relevant chunk-এর surrounding context কখন দরকার?
5. Chunk Size বনাম Context Quality

### B. Parent-Child Retrieval

6. Parent Document কী?
7. Child Chunk কী?
8. Parent-Child Relationship
9. Parent-Child Chunking কী?
10. Parent ID ও Child ID
11. Parent Metadata বনাম Child Metadata
12. Parent Document Storage Strategy

### C. Small-to-Big Retrieval

13. Small-to-Big Retrieval কী?
14. Retrieval-এ ছোট chunk কেন ব্যবহার হয়?
15. Retrieved child থেকে parent context কীভাবে পাওয়া যায়?
16. Parent Expansion কী?
17. Parent Expansion বনাম normal chunk retrieval
18. Duplicate parent handling

### D. Retrieval Pipeline

19. Document ingestion
20. Parent document creation
21. Child chunk generation
22. Parent-child mapping
23. Child embedding generation
24. Child chunk retrieval
25. Parent document expansion
26. Context assembly
27. Final context selection

### E. Precision, Recall & Context

28. Small chunks কীভাবে precision-এ সাহায্য করে?
29. Parent expansion কীভাবে context completeness বাড়ায়?
30. Context noise
31. Duplicate context
32. Context window ও token budget
33. Parent expansion-এর trade-offs

### F. Advanced Integration

34. Parent-Child + Vector Search
35. Parent-Child + Hybrid Search
36. Parent-Child + Reranking
37. Parent-Child + Multi-Query
38. Parent-Child + HyDE
39. Metadata filtering
40. Complete Parent-Child RAG Architecture

### G. Production Considerations

41. Parent document storage
42. Database relationship design
43. Parent-child deletion handling
44. Document update ও re-indexing
45. Missing parent handling
46. Latency ও storage trade-offs

## Top 5 Interview Questions

প্রশ্নগুলো একবারে একটি করে আলোচনা হবে; user `next` বললে পরের প্রশ্ন আসবে।

1. What is Parent-Child Retrieval and why is it used in RAG?
2. What is Small-to-Big Retrieval and how does it work?
3. Why do we retrieve small chunks but provide larger parent context to the LLM?
4. How do you prevent duplicate parent documents and excessive context expansion?
5. How would you integrate Parent-Child Retrieval with Hybrid Search, Reranking, and HyDE?

## Coding Plan — After Concepts and Q&A

```text
Original document
  → store parent record/content
  → existing cleaner/chunker creates small child chunks
  → embed/store children with parent mapping
  → existing vector/hybrid retrieval finds children
  → existing reranker ranks children using original query
  → expand selected children to bounded parent context
  → deduplicate parents and enforce current context budget
  → answer from stored source context; return child/parent source metadata
```

### Data Model and Migration Decisions to Verify

- Treat current `Document` as the likely parent and `DocumentChunk` as child; verify before implementation. `sourceDocumentId` already maps child to parent by convention, so first determine whether a relational FK can formalize this without a duplicate `parentId`.
- Parent body is not currently stored. Compare two options: store the cleaned full text in a nullable `Document.content` field (additive migration; old rows remain null) or reconstruct context from all child rows. Pick after testing overlap/offset behavior and storage cost; document fallback for existing records.
- Before adding a foreign key, run read-only checks for chunks whose `sourceDocumentId` has no Document and tenant mismatches. Resolve/backfill deliberately; never delete user data to make a migration pass.
- Inspect existing migration mechanism and database state first. Use a reviewed additive migration; do not reset the database, drop/recreate tables, or assume `prisma db push` is safe for populated data.
- Consider a compound index for tenant + parent lookup + chunk ordering only after checking current indexes and query shape. Current schema already has separate `tenantId` and `sourceDocumentId` indexes.

### Implementation Requirements

1. Reuse existing Document/DocumentChunk and existing smart chunking unless inspection demonstrates a concrete gap.
2. Store parent content or implement a documented legacy reconstruction path; keep document/chunk tenant ownership consistent.
3. Embed child chunks only; preserve existing embedding model/dimensions.
4. Preserve parent/child mapping and offsets/metadata.
5. Retrieve child chunks with existing Vector or Hybrid Retrieval and existing filters/thresholds.
6. Reuse existing reranker and pass it the original question plus child chunk text.
7. Expand only after child ranking; deduplicate by parent/document ID.
8. Bound expansion by the existing `maxContextChars` behavior and a configurable parent/expansion limit. Inspect current defaults first; avoid inventing unmeasured limits.
9. Prefer relevant windows around child offsets when a full parent would exceed budget; define deterministic fallback for old documents with no parent body or invalid offsets.
10. Keep child and parent source identifiers/metadata in `/ask` response without citing generated content.
11. Make feature behavior configurable and preserve the existing child-only retrieval path for regression comparison.
12. Make ingestion/update atomic where possible. Define re-index policy so old children are not deleted until new parent/chunks/embeddings are safely ready.
13. Handle missing parent, empty child set, duplicate children/parents, DB/embedding failures, no results, reranker failure, and tenant boundary violations without crossing tenant data.
14. Do not implement Agentic RAG, Knowledge Graph RAG, fine-tuning, ColBERT, late interaction, distributed retrieval, paid APIs, or large GPU-only models.

## Testing Requirements

Automated tests should cover:

1. Parent document creation.
2. Child chunk generation and offsets.
3. Correct child-parent and tenant relationship.
4. Child embeddings and dimension validation.
5. Child retrieval, including hybrid retrieval.
6. Parent expansion after reranking.
7. Multiple children resolving to one parent.
8. Duplicate parent/context removal.
9. Missing parent fallback.
10. Empty document/child handling.
11. Context budget and expansion limit.
12. Original query reaches reranker and final answer generation.
13. Document update/re-index failure leaves old data usable.
14. Tenant isolation on child retrieval and parent expansion.
15. No result and reranker failure.
16. Existing Week 2/Week 3 RAG regression tests.

Use local mocks for unit tests; database integration tests must use the repository's actual setup and avoid destructive resets.

## Manual Terminal Guide — To Fill After Implementation

Existing verified routes: `POST /vectors/ingest`, `POST /vectors/search`, `POST /ask`, `GET /vectors/health`, `GET /vectors/stats`. No parent-inspection endpoint currently exists, so do not invent one. After schema/API design, document a safe read-only SQL command using actual connection configuration (or add an endpoint only if implementation requires it).

After coding, this guide must provide exact commands and expected response/status for:

- Start PostgreSQL/pgvector, Ollama, and backend; check health and model availability.
- Ingest one document long enough to create multiple child chunks.
- Verify stored parent and child mappings without exposing credentials.
- Run direct child search and normal `/ask`; compare child-only vs parent-expanded context using the real feature switch added by implementation.
- Check same-parent child deduplication and source metadata.
- Check Hybrid + reranker behavior, no-result, and high-threshold behavior.
- Re-ingest/update the same source and verify obsolete children are not mixed with new children.
- Test a missing-parent case only in isolated test data and clean up only those test rows.
- Show expected HTTP status, response fields, success signals, and likely failure diagnosis for each command.

No test result will be called passed until run and observed.

## Documentation Synchronization

- Main roadmap links here; it remains the only progress overview.
- This file is the Day 6 learning, design, coding, testing, and terminal guide.
- There are no separate current database/API architecture documents in `docs/`; if implementation changes schema or response shape, update Prisma comments and this file, and add/update API docs only if a durable API reference is introduced.
- Keep Week 2 and Week 3 Day 1–5 docs intact. Day 6 is not complete until implementation, tests, docs, and manual evaluation are verified.

## Day 6 Workflow and Status

```text
Concept reading
  → Top 5 interview Q&A (one-by-one via `next`)
  → user asks to start coding
  → inspect live schema/data and migration approach
  → implement incrementally
  → automated tests
  → manual terminal guide/tests
  → sync docs and report results
```

**Current status: plan prepared; no Day 6 schema, application code, migration, or tests have been changed.**
