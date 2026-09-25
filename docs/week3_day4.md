# Week 3 - Day 4

## Query Expansion & Multi-Query Retrieval

আজকের লক্ষ্য হলো বুঝা কীভাবে একটা user query থেকে একাধিক useful search query তৈরি করা যায় retrieval recall বাড়ানোর জন্য, এবং এটা কীভাবে existing Hybrid Search + Reranking + RAG-এর সাথে integrate হয়।

কোনো core concept skip করা যাবে না। আগে concepts, তারপর TOP 5 Q&A, তারপর coding।

---

## Context

- Environment: Ubuntu, 8GB RAM, $0 budget, কোনো paid API নয়
- Stack: NestJS, TypeScript, Prisma, PostgreSQL + pgvector, Ollama (local LLM), Next.js
- Embedding model: local `nomic-embed-text`
- Previous milestones: Week 1 সম্পূর্ণ, Week 2 সম্পূর্ণ, Week 3 Day 1 (configurable Top-K/threshold retrieval), Week 3 Day 2 (Hybrid Search — `KeywordRetrievalService` FTS + `HybridRetrievalService` RRF fusion), Week 3 Day 3 (Reranking — `Reranker` abstraction + `LlmRerankerService`, `candidateTopK` -> rerank -> `finalTopK`) সবগুলো concept+coding সম্পূর্ণ
- Existing flow: `POST /ask` -> query validation -> hybrid retrieval (`candidateTopK`) -> reranking -> `topK` (final) -> context construction -> LLM generation -> answer + sources
- Project: AI Business Copilot

---

## Day 4 working rules

- সব প্রয়োজনীয় concept এবং TOP 5 interview প্রশ্ন সম্পূর্ণ না হওয়া পর্যন্ত coding শুরু হবে না
- কোনো গুরুত্বপূর্ণ/core concept skip করা যাবে না
- শুধু বাংলায় ব্যাখ্যা করা হবে (এই roadmap-এর জন্য)
- উত্তর সংক্ষিপ্ত ও focused রাখা হবে (অনেক প্রশ্ন বাকি আছে)
- TOP 5 প্রশ্ন একটা একটা করে; user `next` বললে পরেরটা। একসাথে সব Q&A দেওয়া যাবে না
- প্রতিটি concept/প্রশ্নে useful হলে ছোট technical example থাকবে
- প্রাসঙ্গিক হলে "Interview Trap" থাকবে
- এটা academic theory না — AI Engineering + senior software engineering interview preparation-এর জন্য
- TOP 5 প্রশ্ন সম্পূর্ণ হওয়ার পরে coding শুরুর আগে user explicitly বলার জন্য অপেক্ষা করা হবে
- Existing Week 2 + Week 3 Day 1-3 RAG/retrieval/reranking implementation rebuild হবে না — reuse হবে
- আজ implement করা হবে না: HyDE, Agentic RAG, Knowledge Graph RAG, Query Routing, Fine-tuning, ColBERT, Late Interaction, Learned Sparse Retrieval, Advanced Agent workflow, Complex distributed retrieval, Paid API, Large GPU-only model

---

# PART 1 - DAY 4 MAIN GOAL

একটা user query কীভাবে একাধিক useful search query-তে expand করা যায় retrieval recall বাড়ানোর জন্য, এবং এটা কীভাবে Hybrid Search + Reranking + RAG-এর সাথে integrate হয় তা বুঝা।

---

# PART 2 - MUST-LEARN CONCEPTS (কোনোটাই skip নয়)

## A. Query Quality

1. Query Quality
2. কেন user query সবসময় retrieval-এর জন্য optimal নয়
3. Short/Ambiguous Query
4. Underspecified Query
5. Search Query বনাম Natural Language Question

## B. Query Expansion

6. Query Expansion কী?
7. কেন Query Expansion ব্যবহার হয়
8. Original Query + Expanded Terms
9. Synonym Expansion
10. Related Terms Expansion
11. Domain-specific Term Expansion
12. Query Expansion-এর সুবিধা
13. Query Expansion-এর ঝুঁকি/সীমাবদ্ধতা

## C. Multi-Query Retrieval

14. Multi-Query Retrieval কী?
15. কেন একটা query থেকে একাধিক query তৈরি করা হয়
16. Query Diversity
17. Different Query Perspectives
18. Multi-Query বনাম Query Expansion

## D. Retrieval Pipeline

19. একাধিক query-র জন্য retrieval
20. প্রতি query-তে Top-K
21. Candidate Pool
22. Result Merging
23. Deduplication
24. Ranking/Reranking
25. Final Top-K

## E. Recall & Precision

26. Multi-Query কীভাবে Recall উন্নত করে
27. কেন বেশি Recall মানেই বেশি Precision নয়
28. Retrieval Noise
29. কেন Query Expansion irrelevant result আনতে পারে

## F. LLM-based Query Generation

30. Search query তৈরি করতে LLM ব্যবহার
31. Query-generation prompt
32. Query count limit
33. Duplicate query প্রতিরোধ
34. Invalid query handling
35. Query-generation failure হলে fallback

## G. RAG Integration

36. Multi-Query + Vector Search
37. Multi-Query + Hybrid Search
38. Multi-Query + Reranking
39. সম্পূর্ণ retrieval architecture
40. Latency/Cost trade-off

---

# PART 3 - TOP 5 INTERVIEW QUESTIONS

সব concept শেখানোর পরে একটা একটা করে দেওয়া হবে। প্রথমে Question 1; user `next` বললে Question 2। একসাথে ৫টা নয়।

1. Query Expansion কী এবং Retrieval-এর জন্য এটি কেন ব্যবহার করা হয়?
2. Multi-Query Retrieval কী এবং এটি কীভাবে Retrieval Recall উন্নত করতে পারে?
3. Query Expansion এবং Multi-Query Retrieval-এর মধ্যে পার্থক্য কী?
4. একাধিক query থেকে retrieve হওয়া result কীভাবে Merge, Deduplicate, এবং Rerank করব?
5. Multi-Query Retrieval-এর সুবিধা, সীমাবদ্ধতা, এবং Latency/Cost trade-off কী?

সব ৫টা প্রশ্ন শেষ হওয়ার পরে, coding শুরু করার জন্য user explicitly বলার জন্য অপেক্ষা করা হবে।

---

# PART 4 - CODING SCOPE (TOP 5 Q&A শেষ এবং user explicitly শুরু করতে বলার পরে)

Existing (reuse হবে, rebuild নয়): Week 2 + Week 3 Day 1-3-এর RAG/retrieval/reranking implementation — `VectorDbService`, `KeywordRetrievalService`, `HybridRetrievalService`, `Reranker`/`LlmRerankerService`, `RagService`।

## Target architecture

```text
User Query
    |
Query Generator
    |
Query 1 -> Retrieval
Query 2 -> Retrieval
Query 3 -> Retrieval
    |
Merge Results
    |
Deduplicate
    |
Hybrid/Retrieval Ranking
    |
Reranker
    |
Final Top-K
    |
Context
    |
LLM
```

## Coding requirements

- `QueryExpansionService` / `MultiQueryService` abstraction
- Configurable query count
- Original query সবসময় preserve করতে হবে
- Generated query validate করতে হবে
- Duplicate query বাদ দিতে হবে
- একাধিক retrieval call
- Result merge করা
- Chunk deduplicate করা
- Chunk metadata preserve করা
- Candidate limit
- Existing `RerankerService` reuse করা
- Empty-result handling
- Query-generation failure হলে original query-তে fallback
- Timeout handling
- Retrieval failure handling
- Logging
- Unit/integration test

## Testing

1. শুধু original query
2. ৩টা generated query
3. ৫টা generated query
4. Duplicate query
5. Empty query
6. Ambiguous query
7. কোনো retrieval result নেই
8. Query-generation failure
9. Retrieval failure
10. Reranker failure

---

# PART 5 - CORE MENTAL MODEL

```text
Basic Retrieval:
Query -> Retrieve

Reranking:
Query -> Retrieve Candidates -> Rerank

Multi-Query:
Query -> Multiple Queries -> Retrieve -> Merge

Multi-Query + Reranking:
Query
  -> Multiple Queries
  -> Retrieve
  -> Merge + Deduplicate
  -> Rerank
  -> Final Top-K
```

**মূল নীতি:**
- Multi-Query মূলত **Recall** উন্নত করার চেষ্টা করে।
- Reranking মূলত চূড়ান্তভাবে নির্বাচিত candidate-দের **quality/precision** উন্নত করে।

---

# PART 6 - DAY 4 COMPLETION CHECKLIST

## Concepts (A-G, ৪০টা) সব confidently explain করতে হবে

- Query quality এবং কেন raw user query সবসময় ভালো retrieval query নয়
- Query Expansion (synonym/related/domain-specific) এবং তার সুবিধা-ঝুঁকি
- Multi-Query Retrieval এবং Query Expansion-এর পার্থক্য
- Multiple query থেকে merge, deduplicate, rerank, final Top-K flow
- Recall বনাম Precision, Multi-Query কেন noise আনতে পারে
- LLM দিয়ে query generation, prompt, count limit, duplicate prevention, failure fallback
- Multi-Query কীভাবে Vector/Hybrid Search/Reranking/RAG-এর সাথে যুক্ত হয়, latency/cost trade-off

## TOP 5 প্রশ্ন

সব ৫টা প্রশ্নের উত্তর সম্পূর্ণ হতে হবে, একটা একটা করে।

## Coding (শুধু concepts + Q&A শেষ হলে, user শুরু করতে বললে)

- `QueryExpansionService`/`MultiQueryService` তৈরি হয়েছে
- Configurable query count, original query preserve, invalid/duplicate query filtering
- একাধিক query দিয়ে retrieval, merge, deduplicate, metadata preserve
- Existing reranker reuse করে final ranking
- Empty-result, query-generation failure, timeout, retrieval failure, reranker failure — সব handle হয়েছে (crash নয়, fallback করে)
- Logging (sensitive data ছাড়া)
- ১০টা test case cover হয়েছে

## Important

Concepts, TOP 5 Q&A, এবং Coding — এই তিনটাই সম্পূর্ণ না হওয়া পর্যন্ত Day 4 complete মনে করা যাবে না। Coding শুরু হবে শুধুমাত্র user explicitly অনুমতি দিলে।
