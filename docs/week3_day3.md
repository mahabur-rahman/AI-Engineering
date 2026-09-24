# Week 3 - Day 3

## Retrieval Reranking & Cross-Encoder Fundamentals

আজকের লক্ষ্য হলো বুঝা কেন initial retrieval একা যথেষ্ট নয়, reranking কী, two-stage retrieval কীভাবে কাজ করে, এবং existing Hybrid Search-এর উপর একটা local/free reranker বসিয়ে RAG retrieval pipeline-এর precision কীভাবে উন্নত করা যায়।

কোনো core concept বা terminology skip করা যাবে না। আগে concepts + Q&A, তারপর coding।

---

## Context

- Study time: 1-1.5 ঘণ্টা/দিন
- Environment: Ubuntu, 8GB RAM, $0 budget, কোনো paid API নয়
- Stack: NestJS, TypeScript, Prisma, PostgreSQL + pgvector, Ollama (local LLM), Next.js
- Embedding model: local `nomic-embed-text`
- Previous milestones: Week 1 সম্পূর্ণ, Week 2 সম্পূর্ণ, Week 3 Day 1 (Advanced Retrieval Fundamentals — configurable Top-K/threshold, scores, logging) সম্পূর্ণ, Week 3 Day 2 (Hybrid Search Fundamentals — `KeywordRetrievalService` FTS, `HybridRetrievalService` RRF fusion, `/retrieval/hybrid`, `/ask` hybrid integration) সম্পূর্ণ
- Existing flow: `POST /ask` -> query validation -> hybrid retrieval (vector + keyword -> RRF fusion) -> Top-K -> context construction -> LLM generation -> answer + sources
- Project: AI Business Copilot

---

## Day 3 working rules

- কোনো core concept বা terminology skip করা যাবে না
- Concepts এবং TOP 5 Q&A শেষ না হওয়া পর্যন্ত coding শুরু হবে না
- TOP 5 প্রশ্ন একটা একটা করে; user `next` বললে পরেরটা। একসাথে ৫টাই দেওয়া যাবে না
- প্রতিটি concept: বাংলায় ব্যাখ্যা, ছোট technical example, প্রয়োজনে Interview Trap
- Cross-Encoder/Bi-Encoder-এর neural-network mathematics-এ যাওয়া হবে না; practical বোঝাই লক্ষ্য
- Existing embedding pipeline, vector DB, vector retrieval, keyword retrieval, hybrid search, RAG generation rebuild হবে না — reuse হবে
- Reranking logic LLM generation service-এর ভিতরে রাখা যাবে না; Retrieval, Fusion, Reranking, Context Construction, Generation — এই ৫টা layer আলাদা থাকবে
- Coding step-by-step: কী, কেন, কোন file/code area, minimal code, user implement করবে, test, review, তারপর পরের step
- Reranker model বেছে নেওয়ার আগে resource requirement (CPU/RAM/latency) explain করতে হবে; বড় বা GPU-only model জোর করে বসানো যাবে না
- আজ implement করা হবে না: Query Expansion, Multi-Query Retrieval, HyDE, Agentic RAG, Knowledge Graph RAG, Fine-tuning, LoRA, ColBERT, Late Interaction Retrieval, Learned Sparse Retrieval, Complex distributed reranking infrastructure, Paid reranking API, Large GPU-only model, Advanced evaluation framework

---

# PART 1 - DAY 3 GOAL (শেষে যা বুঝতে হবে)

1. কেন initial retrieval সবসময় যথেষ্ট নয়
2. Reranking মানে কী
3. Retrieval বনাম reranking
4. Two-stage retrieval
5. Candidate generation
6. Candidate set
7. First-stage retriever
8. Second-stage reranker
9. Cross-Encoder
10. Bi-Encoder / Dual-Encoder
11. Cross-Encoder বনাম Bi-Encoder
12. কেন Cross-Encoder relevance উন্নত করতে পারে
13. কেন Cross-Encoder ধীর
14. Reranking-এ precision বনাম recall
15. Candidate Top-K বনাম Final Top-K
16. Reranking pipeline
17. Vector Search-এর পরে reranking
18. Hybrid Search-এর পরে reranking
19. Reranker score
20. Reranker score বনাম similarity score
21. Score interpretation
22. Reranking threshold
23. Latency বিবেচনা
24. Computational cost
25. Candidate set size trade-off
26. Reranking failure case
27. Reranking এবং context quality
28. RAG-এর ভিতরে reranking
29. Local/free reranking option
30. কখন reranking ব্যবহার করা উচিত এবং কখন নয়

---

# PART 2 - MUST-LEARN CONCEPTS (কোনোটাই skip নয়)

## A. Why Reranking?

1. Top-K retrieval কেন যথেষ্ট নয়
2. Retrieval relevance-এর সীমাবদ্ধতা
3. Retrieval noise
4. কেন first-stage retrieval recall-কে priority দেয়
5. কেন final context-এ বেশি precision দরকার
6. কেন first-stage retriever আর final ranking-এর goal আলাদা

বুঝতে হবে: **Recall-oriented retrieval বনাম Precision-oriented final selection**

## B. Reranking কী?

7. Reranking-এর definition
8. Reranker
9. Initial retrieval
10. Candidate results
11. Candidate result reranking
12. Final ranked results
13. Final Top-K

বুঝতে হবে: Retrieval বনাম Reranking-এর পার্থক্য

## C. Two-Stage Retrieval

14. Two-stage retrieval কী?
15. Stage 1 — Candidate Retrieval
16. Stage 2 — Reranking
17. কেন Stage 1 বেশি candidate আনে
18. কেন Stage 2 candidate কমায়
19. Candidate Top-K
20. Final Top-K

উদাহরণ:
```text
Vector/Hybrid Search -> Top 20 candidates -> Reranker -> Top 5 final chunks
```
এটা কেন সরাসরি `Vector Search -> Top 5`-এর চেয়ে ভালো তা বুঝতে হবে।

## D. Bi-Encoder / Dual-Encoder

21. Bi-Encoder কী?
22. Embedding কীভাবে তৈরি হয়
23. Query embedding
24. Document/chunk embedding
25. Independent encoding
26. Vector similarity
27. কেন Bi-Encoder দ্রুত
28. কেন এটা first-stage retrieval-এর জন্য উপযুক্ত

## E. Cross-Encoder

29. Cross-Encoder কী?
30. Query + document pair
31. Joint encoding
32. Query আর document-এর মধ্যে interaction
33. Cross-Encoder scoring
34. কেন Cross-Encoder fine-grained relevance ভালো বোঝে
35. কেন Cross-Encoder ধীর
36. কেন Cross-Encoder সাধারণত পুরো database scan করতে ব্যবহার হয় না

(অপ্রয়োজনীয় neural-network mathematics নয়; practical understanding-ই লক্ষ্য)

## F. Bi-Encoder বনাম Cross-Encoder

37. Architecture পার্থক্য
38. Input পার্থক্য
39. Speed পার্থক্য
40. Accuracy/relevance পার্থক্য
41. Scalability পার্থক্য
42. Computational cost
43. RAG pipeline-এ কোনটা কোথায় থাকে

বুঝতে হবে:
- **Bi-Encoder:** দ্রুত candidate retrieval
- **Cross-Encoder:** ধীর কিন্তু শক্তিশালী candidate ranking

## G. Reranking Pipeline

পুরো pipeline বুঝতে হবে:
```text
User Query
  -> Query Processing
  -> First-Stage Retrieval
  -> Candidate Top-K
  -> Reranker
  -> Reranker Scores
  -> Sort
  -> Final Top-K
  -> Context Construction
  -> LLM
  -> Answer + Sources
```

## H. Reranker Scores

44. Reranker score কী?
45. Vector similarity score থেকে কীভাবে আলাদা
46. BM25/keyword score থেকে কীভাবে আলাদা
47. কেন ভিন্ন reranker-এর score universally তুলনাযোগ্য নয়
48. কেন score-কে automatically probability ভাবা যাবে না
49. Reranker score threshold
50. Reranker score দিয়ে ranking

**গুরুত্বপূর্ণ:** `0.95 = 95% correctness` — এই ধারণা ভুল কেন তা explain করতে হবে।

## I. Candidate Size

51. Candidate Top-K
52. Final Top-K
53. কেন candidate K সাধারণত বড় রাখা হয়
54. Candidate K খুব ছোট হলে কী হয়
55. Candidate K খুব বড় হলে কী হয়
56. Final K খুব বড় হলে কী হয়
57. Final K খুব ছোট হলে কী হয়
58. Candidate size বনাম recall
59. Candidate size বনাম latency

উদাহরণ: `candidateTopK = 20`, `finalTopK = 5`

## J. Vector Search-এর পরে Reranking

60. Vector Search
61. Candidate retrieval
62. Reranking
63. Final selection

বুঝতে হবে: Vector Search candidate খুঁজে বের করে; Reranker ঠিক করে কোন candidate সবচেয়ে relevant।

## K. Hybrid Search-এর পরে Reranking

64. Hybrid Search
65. Combined candidate set
66. Deduplication
67. Reranking
68. Final Top-K

Pipeline:
```text
Vector Search + Keyword Search -> Hybrid Fusion -> Candidate Set -> Reranker -> Final Top-K
```
এটা কেন useful হতে পারে তা বুঝতে হবে।

## L. Precision / Recall

69. Retrieval Recall
70. Retrieval Precision
71. Reranking Precision
72. কেন first-stage retrieval recall preserve করা উচিত
73. কেন reranking final precision উন্নত করে
74. Candidate retrieval একটা relevant chunk miss করলে কী হয়
75. Reranking missing chunk recover করতে পারে না

**মূল ধারণা:** একটা reranker retrieved candidate-দের reorder করতে পারে, কিন্তু যেটা retrieve-ই হয়নি সেটাকে rank করতে পারে না।

## M. Latency & Cost

76. কেন reranking latency যোগ করে
77. Candidate count কেন latency-কে প্রভাবিত করে
78. কেন Cross-Encoder vector similarity-র চেয়ে expensive
79. পুরো database rerank করা কেন impractical
80. Candidate size বনাম latency trade-off
81. Quality বনাম latency trade-off
82. Production বিবেচনা

## N. Reranking Failure Cases

83. Candidate set-এ relevant chunk নেই
84. খারাপ candidate retrieval
85. খারাপ query
86. খারাপ chunking
87. Domain mismatch
88. দুর্বল reranker
89. Candidate set খুব ছোট
90. Candidate set খুব বড়
91. Reranker lexical signal-এ overfit করা
92. False positive reranking
93. False negative reranking

## O. Reranking + RAG

94. কেন reranking context quality উন্নত করে
95. কম irrelevant context
96. ভালো final Top-K
97. ভালো context precision
98. Token efficiency
99. Hallucination-এর উপর সম্ভাব্য প্রভাব
100. Reranking factual correctness guarantee করে না

**গুরুত্বপূর্ণ:** Reranking retrieval ordering উন্নত করে। এটা grounding, context validation, RAG evaluation, বা LLM quality control-এর replacement নয়।

## P. Local / Free Reranking

101. কেন local reranking এই project-এর জন্য useful
102. CPU/RAM বিবেচনা
103. Lightweight reranker model
104. Local inference
105. Model download/storage trade-off
106. 8GB machine-এ latency

Paid API লাগবে না। হার্ডওয়্যারের জন্য অনুপযুক্ত বড় model জোর করে বসানো হবে না। নির্দিষ্ট কোনো reranker model suggest করলে আগে তার resource requirement explain করতে হবে।

---

# PART 3 - TOP 5 MUST-ANSWER QUESTIONS

সব concept শেখানোর পরে একটা একটা করে দেওয়া হবে। প্রথমে Question 1; user `next` বললে Question 2। একসাথে ৫টা নয়।

1. Reranking কী এবং Initial Retrieval-এর পরে এটি কেন ব্যবহার করা হয়?
2. Bi-Encoder বনাম Cross-Encoder কী এবং Reranking-এর ক্ষেত্রে Cross-Encoder কেন বেশি relevant হতে পারে?
3. Candidate Top-K এবং Final Top-K-এর মধ্যে পার্থক্য কী?
4. Reranking কীভাবে Retrieval Precision improve করে, এবং কেন এটি missed relevant chunk recover করতে পারে না?
5. Hybrid Search + Reranking একসাথে ব্যবহার করলে RAG retrieval pipeline কীভাবে improve হতে পারে, এবং এর latency/cost trade-off কী?

---

# PART 4 - CODING PART (সব concept question শেষ হওয়ার পরে)

Existing (reuse হবে, rebuild নয়):

- Embedding pipeline
- Vector database
- `VectorDbService` (vector retrieval)
- `KeywordRetrievalService` (keyword/FTS retrieval)
- `HybridRetrievalService` (RRF fusion)
- `RagService` (RAG generation)

## Coding goal

```text
Hybrid/Vector Retrieval -> Candidate Set -> Reranker -> Final Top-K -> Context -> LLM
```

Reranker অবশ্যই initial retrieval-এর **পরে** কাজ করবে।

## Architecture target

```text
                    User Query
                         |
                  Query Processing
                         |
              +----------+----------+
              |                     |
        Vector Search          Keyword Search
              |                     |
              +----------+----------+
                         |
                   Hybrid Fusion
                         |
                  Candidate Top-K
                         |
                     Reranker
                         |
                   Final Top-K
                         |
                Context Construction
                         |
                    LLM / Ollama
                         |
                  Answer + Sources
```

## Architecture principle

Retrieval, Fusion, Reranking, Context Construction, Generation — এই ৫টা আলাদা থাকবে। Reranking logic LLM generation service-এর ভিতরে থাকবে না।

---

## STEP 1 - Existing code inspect (কোড modify নয়)

চিহ্নিত করতে হবে এবং reranker ঠিক কোথায় বসবে তা explain করতে হবে:

- `VectorRetrievalService` (`VectorDbService`)
- `KeywordRetrievalService`
- `HybridRetrievalService`
- RAG Orchestrator (`RagService`)
- Chunk schema (`DocumentChunk`)
- Embedding storage
- Existing metadata
- Existing Top-K configuration
- Existing threshold configuration
- Existing logging
- Existing tests

## STEP 2 - Reranker interface

`RerankerService`-এর মতো clean abstraction।

- Input: query, candidate chunks
- Output: chunk, rerankerScore, original metadata, original retrieval information

পরে implementation বদলানো সহজ হতে হবে; orchestrator কোনো একটা model-এর সাথে tightly coupled থাকবে না।

## STEP 3 - Local reranker বাছাই

Ubuntu, 8GB RAM, $0 budget — তাই lightweight local/free reranker preferred।

Implementation-এর আগে explain করতে হবে:

- model type
- আনুমানিক resource requirement
- CPU feasibility
- inference latency expectation
- উপযুক্ত/অনুপযুক্ত কেন

বড় model অন্ধভাবে বেছে নেওয়া যাবে না। Model-এর জন্য Python runtime লাগলে (NestJS backend হওয়া সত্ত্বেও) architecture clean রাখতে হবে:
```text
NestJS -> Reranker interface -> Local reranker service/process
```
অপ্রয়োজনীয় architecture জোর করা যাবে না।

## STEP 4 - Candidates rerank করা

Input: query + candidate chunks। Output: reranked chunks, প্রতিটায় থাকবে `chunkId`, `content`, `metadata`, original retrieval score(s), `rerankerScore`, final rank।

## STEP 5 - Candidate Top-K

`candidateTopK` (উদাহরণ ২০) introduce করতে হবে। Rerank করার আগেই `finalTopK`-এ সীমাবদ্ধ করা যাবে না।

```text
Hybrid Retrieval -> candidateTopK = 20 -> Reranker -> finalTopK = 5
```

দুটোই configurable হতে হবে।

## STEP 6 - Final ranking

Rerank করার পরে: rerankerScore দিয়ে sort -> `finalTopK` apply -> metadata preserve -> final sources return। প্রথম implementation-এ reranker score-ই final ranking signal হবে; reranker score আর vector similarity score ভুলভাবে একসাথে মেশানো যাবে না যদি না স্পষ্ট justification থাকে।

## STEP 7 - Hybrid Search-এর সাথে integrate

`POST /ask` নতুন flow:
```text
validate query -> hybrid retrieval -> candidateTopK -> reranking -> finalTopK -> context construction -> LLM -> answer + sources
```
Existing generation code reuse হবে।

## STEP 8 - Empty candidates handle করা

Handle করতে হবে (API crash করবে না):

1. vector result নেই
2. keyword result নেই
3. hybrid result নেই
4. reranking-এর জন্য candidate নেই
5. reranker failure
6. reranker timeout
7. invalid reranker response

Reranker fail করলে: failure log করতে হবে, optionally original retrieval ranking-এ fallback করতে হবে, score কখনো silently বানানো যাবে না। বেছে নেওয়া fallback explain করতে হবে।

## STEP 9 - Logging

Log: query, candidateTopK, finalTopK, candidate count, reranked count, reranker latency, final chunk IDs, reranker scores, fallback ব্যবহার হয়েছে কি না।

Log করা যাবে না: secret, token, password, API key, sensitive user data।

## STEP 10 - Testing

- Test A: simple semantic query
- Test B: exact keyword query
- Test C: hybrid query
- Test D: একাধিক similar candidate
- Test E: অনেক weak chunk-এর মধ্যে একটা highly relevant chunk
- Test F: candidate set থেকে relevant chunk missing — verify করতে হবে reranker missing chunk recover করতে পারে না
- Test G: কোনো candidate result নেই
- Test H: reranker failure
- Test I: বিভিন্ন `candidateTopK` (5, 10, 20) তুলনা
- Test J: বিভিন্ন `finalTopK` (3, 5) তুলনা

## STEP 11 - Retrieval তুলনা

তুলনা: Vector-only বনাম Hybrid বনাম Hybrid + Reranking। পর্যবেক্ষণ: relevant chunks, irrelevant chunks, ordering, retrieval noise, final context quality, latency। "reranking সবসময় সবকিছু উন্নত করে" এমন claim করা যাবে না — আসল observation record করতে হবে।

## STEP 12 - Basic evaluation

Existing evaluation approach (Week 2 Day 7) ব্যবহার করে measure করতে হবে: precision, recall, Relevant@K, retrieval noise, ranking quality, latency। Advanced evaluation framework আজ না।

---

# PART 5 - INTERVIEW-LEVEL UNDERSTANDING

Day 3 শেষে confidently উত্তর দিতে পারতে হবে:

- Reranking কেন দরকার?
- Two-stage retrieval কী?
- Candidate set কী?
- Reranker কী?
- Cross-Encoder কী?
- Bi-Encoder কী?
- Cross-Encoder কেন ধীর?
- পুরো database-এ Cross-Encoder কেন ব্যবহার হয় না?
- candidateTopK কেন finalTopK-এর চেয়ে বড় রাখা হয়?
- Reranking কি missing document recover করতে পারে?
- Reranking কীভাবে precision উন্নত করে?
- Latency trade-off কী?
- Vector Search বনাম Hybrid Search বনাম Reranking
- RAG-এর ভিতরে reranking কোথায় বসে?

---

# PART 6 - DAY 3 SUCCESS CRITERIA

## Concepts

- Reranking
- Two-stage retrieval
- Candidate retrieval
- Candidate Top-K
- Final Top-K
- Bi-Encoder
- Cross-Encoder
- Reranker score
- Retrieval score বনাম reranker score
- Precision/Recall সম্পর্ক
- Reranking limitations
- Latency/cost trade-off
- Vector Search-এর পরে reranking
- Hybrid Search-এর পরে reranking
- RAG-এর ভিতরে reranking
- Local/free reranking বিবেচনা

## Coding

- Existing retrieval reuse করা হয়েছে
- Reranker abstraction তৈরি হয়েছে
- Local/free reranker integrate হয়েছে
- Candidate Top-K configurable
- Final Top-K configurable
- Candidates rerank হয়েছে
- Final ranking implement হয়েছে
- Metadata preserve হয়েছে
- No-result handling implement হয়েছে
- Reranker failure handling implement হয়েছে
- Logging implement হয়েছে
- Test implement হয়েছে
- Vector বনাম Hybrid বনাম Hybrid + Reranking তুলনা করা হয়েছে
- Basic retrieval evaluation সম্পন্ন হয়েছে

## Important

Concepts/Q&A এবং Coding — দুটোই সম্পূর্ণ না হওয়া পর্যন্ত Day 3 complete mark করা যাবে না। Coding শুরুর আগে TOP 5 প্রশ্ন সম্পূর্ণ হতে হবে।
