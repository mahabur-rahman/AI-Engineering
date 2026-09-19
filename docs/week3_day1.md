# Week 3 - Day 1

## Advanced Retrieval Fundamentals

আজকের লক্ষ্য হলো basic vector search কেন fail করতে পারে তা বোঝা এবং production-oriented RAG system-এ retrieval quality উন্নত করার fundamental mechanism শেখা।

আজ বেশি দূর এগোনো হবে না — শুধু WHY basic vector search fail করে এবং সেটা উন্নত করার fundamental mechanism বোঝা। Advanced agentic RAG বা complex research-level retrieval technique আজকের scope-এর বাইরে।

---

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Stack: Node.js, NestJS, TypeScript, PostgreSQL, pgvector, Prisma, Ollama
- Embedding model: local `nomic-embed-text`
- Generation model: local Ollama model configured in `.env.local`
- Previous milestone: Week 2 সম্পূর্ণ (Day 1-7: prompt security/evaluation, embeddings, chunking, retrieval, RAG generation, end-to-end integration, RAG evaluation)
- Project: AI Business Copilot

---

## Day 1 working rules

- Concepts এবং TOP 5 প্রশ্ন শেষ না হওয়া পর্যন্ত coding শুরু হবে না
- Week 2-এর working retrieval service, vector search, embedding service, এবং RAG pipeline rebuild করা হবে না — reuse করা হবে
- Coding step-by-step হবে: প্রতিটি ধাপে কী এবং কেন explain করা হবে, শুধু প্রয়োজনীয় code দেখানো হবে, implement ও test করার পর review হয়ে পরের ধাপে যাওয়া হবে
- Similarity thresholding কোড করার আগে বর্তমান pgvector query আসলে cosine similarity, cosine distance, নাকি inner product ব্যবহার করে তা inspect ও explain করতে হবে — distance এবং similarity-এর direction এক ধরে নেওয়া যাবে না
- User `next` বললে TOP 5-এর পরের unanswered question দেওয়া হবে
- আজ implement করা হবে না: Hybrid Search, BM25, Reranking, Cross-Encoder, Query Expansion, Multi-Query Retrieval, HyDE, Agentic RAG, Knowledge Graph RAG, Fine-tuning, Advanced evaluation framework

---

# PART 1 - TOPICS TO READ

1. Basic Vector Search-এর সীমাবদ্ধতা
2. Top-K Retrieval কেন fail করতে পারে
3. Semantic Similarity-এর সীমাবদ্ধতা
4. Similarity Score কী
5. Similarity Score বনাম Relevance
6. Relevant Chunk বনাম Highly Similar Chunk
7. False Positive Retrieval কী
8. False Negative Retrieval কী
9. Retrieval Threshold কী
10. Similarity Threshold বনাম Top-K
11. কেন শুধু Top-K যথেষ্ট নয়
12. Retrieval Noise কী
13. Context-এ Irrelevant Chunk-এর প্রভাব
14. Retrieval Precision বনাম Recall
15. Chunking কীভাবে retrieval quality-কে প্রভাবিত করে
16. Embedding model quality কীভাবে retrieval-কে প্রভাবিত করে
17. Query quality এবং retrieval quality-এর সম্পর্ক
18. কখন basic vector search যথেষ্ট নয়
19. Basic retrieval improvement strategies
20. Retrieval quality trade-offs

প্রতিটি concept-এর জন্য:

- আগে বাংলায় ব্যাখ্যা
- সংক্ষিপ্ত ও interview-focused
- ছোট technical example
- প্রয়োজনে Interview Trap
- অপ্রয়োজনীয় real-life analogy ব্যবহার করা হবে না

Concepts শেষ না হওয়া পর্যন্ত coding শুরু হবে না।

---

# PART 2 - TOP 5 MUST-READ QUESTIONS

Concepts শেখানোর পরে শুধু Week 3 Day 1-এর জন্য সবচেয়ে গুরুত্বপূর্ণ ৫টা interview প্রশ্ন দেওয়া হবে, একটা একটা করে study করার জন্য। User `next` বললে পরের প্রশ্ন দেওয়া হবে।

প্রতিটি উত্তর হবে:

- শুধু বাংলা
- সংক্ষিপ্ত উত্তর
- Technical example
- Interview-focused
- প্রয়োজনে Interview Trap

User explicitly না চাইলে ৫টার বেশি প্রশ্ন দেওয়া হবে না।

---

# PART 3 - CODING / PRACTICAL WORK

Concepts এবং TOP 5 প্রশ্ন শেষ হওয়ার পরেই coding শুরু হবে।

Existing stack:

- Backend: NestJS, TypeScript
- Database: PostgreSQL, pgvector
- Embedding: local embedding model
- LLM: Ollama/local LLM
- API: REST

Week 2-এর basic RAG pipeline ইতিমধ্যে কাজ করছে। পুরো RAG system rebuild করা হবে না — existing retrieval service, vector search, embedding service, এবং RAG pipeline reuse করা হবে।

---

# PART 4 - DAY 1 CODING GOAL

Existing retrieval layer উন্নত করতে হবে যাতে retrieval quality আরও সাবধানে control এবং inspect করা যায়।

Implementation-এর ফোকাস:

1. Configurable Top-K
2. Configurable similarity threshold
3. Retrieval-এর সময় similarity threshold apply করা
4. Top-K-only retrieval বনাম Top-K + threshold তুলনা করা
5. Similarity score return করা
6. Retrieved chunk metadata return করা
7. Retrieval result log/debug করা
8. Zero-result retrieval handle করা
9. Highly relevant query test করা
10. Irrelevant query test করা
11. Ambiguous query test করা
12. Thresholding-এর আগে এবং পরে retrieval result তুলনা করা

---

# PART 5 - EXPECTED RETRIEVAL FLOW

```text
User Query
    -> Query Embedding
    -> Vector Search
    -> Calculate/Read Similarity Score
    -> Apply Similarity Threshold
    -> Apply Top-K Limit
    -> Relevant Chunks
    -> Return Chunks + Scores + Metadata
```

---

# PART 6 - CODING TASKS (STEP BY STEP)

## STEP 1: Existing retrieval service review

Week 2-এর existing retrieval service review করতে হবে। Working code rewrite করা হবে না। চিহ্নিত করতে হবে:

- query embedding কোথায় হয়
- vector search কোথায় হয়
- Top-K কোথায় apply হয়
- similarity score কোথায় available

## STEP 2: Top-K configurable করা

```json
{ "topK": 5 }
```

Top-K hard-code করা যাবে না।

## STEP 3: Configurable similarity threshold যোগ করা

```json
{ "topK": 5, "similarityThreshold": 0.75 }
```

শুধু সেই chunk return করা হবে যেগুলো configured threshold satisfy করে, বর্তমান pgvector query-এর similarity/distance behavior অনুযায়ী।

**গুরুত্বপূর্ণ:** বর্তমান implementation cosine similarity, cosine distance, inner product, নাকি অন্য metric ব্যবহার করে তা explain করতে হবে। Metric না বুঝে সংখ্যা তুলনা করা যাবে না।

## STEP 4: Retrieval metadata return করা

```json
{
  "chunkId": "...",
  "documentId": "...",
  "score": 0.87,
  "content": "..."
}
```

## STEP 5: No relevant result handle করা

সব result threshold fail করলে empty result set অথবা controlled "no relevant context" result return করতে হবে। Irrelevant chunk LLM-কে পাঠানো যাবে না।

## STEP 6: Useful retrieval logging যোগ করা

Debug করার জন্য যথেষ্ট তথ্য log করতে হবে:

- query
- Top-K
- threshold
- retrieved chunk সংখ্যা
- similarity scores
- document/chunk IDs

Sensitive user data বা secret log করা যাবে না।

## STEP 7: Retrieval behavior test করা

Test cases তৈরি করতে হবে:

A. Highly relevant query
B. Partially relevant query
C. Completely irrelevant query
D. Ambiguous query
E. কোনো matching document নেই এমন query
F. বিভিন্ন Top-K value
G. বিভিন্ন threshold value

## STEP 8: তুলনা করা

Basic (Top-K only) বনাম Improved (Top-K + Similarity Threshold) — retrieved result-এ কী পরিবর্তন হয় তা document করতে হবে।

---

# PART 7 - IMPORTANT TECHNICAL REQUIREMENT

Similarity thresholding implement করার আগে বর্তমান pgvector distance/operator inspect করতে হবে।

উদাহরণ: cosine distance ব্যবহার হলে — lower distance মানে বেশি similar। সেই distance-কে similarity score-এ convert করলে — higher similarity মানে বেশি similar।

Distance এবং similarity একই direction-এ কাজ করে এমন ধরে নেওয়া যাবে না। Coding শুরুর আগে এটা স্পষ্টভাবে explain করতে হবে।

---

# PART 8 - WHAT NOT TO IMPLEMENT TODAY

- Hybrid Search
- BM25
- Reranking
- Cross-Encoder
- Query Expansion
- Multi-Query Retrieval
- HyDE
- Agentic RAG
- Knowledge Graph RAG
- Fine-tuning
- Advanced evaluation frameworks

এগুলো roadmap অনুযায়ী পরে study করা হবে।

---

# PART 9 - CODING RULES

পুরো implementation একবারে দেওয়া হবে না।

প্রতিটি coding step-এ এই sequence অনুসরণ করা হবে:

1. কী build করা হচ্ছে তা explain করা
2. কেন দরকার তা explain করা
3. শুধু প্রয়োজনীয় code দেখানো
4. ব্যবহারকারী নিজে implement করবে
5. ব্যবহারকারীকে test করতে বলা হবে
6. Code/output review করা হবে
7. তারপর পরের step-এ যাওয়া হবে

যেখানেই সম্ভব Week 2-এর existing code reuse করতে হবে। প্রয়োজন না হলে working code rewrite করা হবে না।

---

# PART 10 - DAY 1 SUCCESS CRITERIA

Week 3 Day 1 শেষে বুঝতে হবে:

- Basic vector search কেন fail করতে পারে
- কেন শুধু Top-K যথেষ্ট নয়
- Similarity score মানে কী
- Similarity এবং relevance-এর পার্থক্য
- False-positive retrieval
- False-negative retrieval
- Similarity threshold
- Top-K বনাম threshold
- Chunking এবং embedding কীভাবে retrieval quality-কে প্রভাবিত করে

এবং কোডে থাকতে হবে:

- Configurable Top-K
- Configurable similarity threshold
- Retrieval scores
- Chunk metadata
- No-result handling
- Retrieval logging
- Basic retrieval tests

## Final flow

```text
Query
  -> Embedding
  -> Vector Search
  -> Score
  -> Threshold
  -> Top-K
  -> Relevant Chunks
  -> RAG Pipeline
```

---

## Important

Week 3 Day 2-তে move করা হবে না যতক্ষণ না:

1. Day 1 concepts সম্পূর্ণ হয়
2. TOP 5 প্রশ্ন সম্পূর্ণ হয়
3. Coding implementation সম্পূর্ণ হয়
4. Retrieval test সম্পূর্ণ হয়
5. Selected pgvector distance/similarity metric-এর সাথে threshold কেন কাজ করে তা বোঝা যায়

---

# RESULTS - Coding Completed

## Metric

- pgvector `<=>` = **cosine distance** (lower = more similar)
- `score = 1 - distance` (higher = more similar)
- Threshold is applied inside SQL: `score >= similarityThreshold`, then `ORDER BY distance`, then `LIMIT topK`

## Files changed

| File | Change |
|---|---|
| `src/vectors/vector.controller.ts` | `similarityThreshold` param (`minSimilarity` still accepted); response returns `chunkId`, `documentId`, `score`, `content`, metadata, `noRelevantContext` |
| `src/vectors/vector-db.service.ts` | debug log: tenant, topK, threshold, count, `chunkId:score` (query length only, no query text) |
| `src/vectors/vector.controller.spec.ts` | 3 new tests: alias, score/metadata, no-result flag |
| `scripts/compare-retrieval.ts` | `npm run compare:retrieval` - Top-K only vs Top-K + threshold |

## Top-K only vs Top-K + threshold (live, nomic-embed-text)

| Query type | Best score | topK=5, threshold 0 | threshold 0.5 | threshold 0.7 |
|---|---|---|---|---|
| Highly relevant | 0.83 | 4 chunks (incl. 0.67 noise) | 4 | 2 |
| Partially relevant | 0.77 | 4 (incl. 0.60 noise) | 4 | 2 |
| Ambiguous | 0.64 | 4 (down to 0.50) | 2 | 0 (recall lost) |
| Irrelevant (parking) | 0.46 | 4 (false positives) | 0 | 0 |
| No matching doc (shipping) | 0.43 | 4 (false positives) | 0 | 0 |

## Findings

- Top-K alone always returns chunks, even for irrelevant queries (false positives, scores about 0.43-0.46).
- Threshold 0.5 removes those, so no irrelevant chunk reaches the LLM.
- Threshold 0.7 removes noise for relevant queries but drops the ambiguous query (recall loss).
- Good starting point for this dataset and model: threshold about 0.5-0.6. It is model- and data-specific, not universal.
- Repeated seeding left duplicate chunks for `eval-tenant` (each result appears twice); harmless for the comparison.
