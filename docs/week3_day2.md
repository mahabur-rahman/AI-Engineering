# Week 3 - Day 2

## Hybrid Search Fundamentals

আজকের লক্ষ্য হলো বুঝা কেন vector search একা fail করতে পারে, keyword (lexical) search কেন এখনও গুরুত্বপূর্ণ, এবং দুটোকে combine করে (Hybrid Search) existing RAG retrieval layer কীভাবে উন্নত করা যায়।

কোনো core concept skip করা যাবে না। আগে concepts + Q&A, তারপর coding।

---

## Context

- Study time: 1-1.5 ঘণ্টা/দিন
- Environment: Ubuntu, 8GB RAM
- Budget: $0, কোনো paid API/service নয়
- Stack: NestJS, TypeScript, Prisma, PostgreSQL + pgvector, Ollama (local LLM), Next.js
- Embedding model: local `nomic-embed-text`
- Previous milestones: Week 1 সম্পূর্ণ, Week 2 সম্পূর্ণ, Week 3 Day 1 (concepts + coding) সম্পূর্ণ
- Existing flow: `POST /ask` -> query validation -> query embedding -> vector retrieval -> Top-K -> context construction -> LLM generation -> answer + sources
- Existing retrieval: `VectorDbService.semanticSearch()` (pgvector `<=>` cosine distance, `score = 1 - distance`, threshold SQL-এ apply হয়), tenant-scoped
- Project: AI Business Copilot

---

## Day 2 working rules

- কোনো core concept skip করা যাবে না
- Concepts এবং TOP 5 Q&A শেষ না হওয়া পর্যন্ত coding শুরু হবে না
- TOP 5 প্রশ্ন একটা একটা করে; user `next` বললে পরেরটা। একসাথে সব দেওয়া যাবে না
- প্রতিটি concept: বাংলায় ব্যাখ্যা, concise কিন্তু technically accurate, ছোট technical example, প্রয়োজনে Interview Trap, অপ্রয়োজনীয় real-life analogy নয়, গুরুত্বপূর্ণ terminology skip নয়
- BM25-এর mathematics-এ বেশি গভীরে যাওয়া হবে না; practical + interview-level বোঝাই লক্ষ্য
- RRF-এর জটিল mathematics আজ implement হবে না; concept ও practical use বোঝা
- Existing Week 2 RAG + Week 3 Day 1 retrieval reuse হবে; পুরো RAG rebuild হবে না
- Retrieval logic এবং LLM generation tightly coupled হবে না
- Coding step-by-step: কী build করছি, কেন, কোন file/code area, minimal code, user implement করবে, test, review, তারপর পরের step। পুরো code একবারে dump করা যাবে না
- আজ implement করা হবে না: Cross-Encoder/Neural Reranking, ColBERT, Query Expansion, Multi-Query Retrieval, HyDE, Agentic RAG, Knowledge Graph RAG, Advanced RAG frameworks, Fine-tuning, Elasticsearch/OpenSearch migration (একান্ত প্রয়োজন ছাড়া), Complex search infrastructure, Advanced LLM evaluation frameworks

---

# PART 1 - DAY 2 GOAL (শেষে যা বুঝতে হবে)

1. Vector search একা কেন fail করতে পারে
2. Keyword search কেন এখনও গুরুত্বপূর্ণ
3. Lexical search মানে কী
4. Semantic search মানে কী
5. Hybrid search মানে কী
6. Vector search বনাম keyword search
7. BM25 fundamentals
8. Exact keyword matching বনাম semantic matching
9. কখন keyword search ভালো
10. কখন vector search ভালো
11. কখন hybrid search useful
12. Sparse বনাম dense retrieval
13. কেন retrieval signal combine করলে লাভ হয়
14. Score normalization basics
15. Vector + keyword score combine করা
16. Weighted hybrid retrieval
17. Reciprocal Rank Fusion (RRF) fundamentals
18. Weighted score fusion বনাম RRF
19. Hybrid search precision/recall trade-off
20. Hybrid search latency/cost trade-off
21. Metadata filtering বনাম keyword search
22. Common hybrid search failure cases
23. Chunking hybrid search-কে কীভাবে প্রভাবিত করে
24. Query wording hybrid search-কে কীভাবে প্রভাবিত করে
25. Hybrid search কীভাবে RAG retrieval quality উন্নত করে

---

# PART 2 - MUST-LEARN TOPICS (কোনোটাই skip করা যাবে না)

## A. Search Fundamentals

1. Information Retrieval কী?
2. Lexical search কী?
3. Semantic search কী?
4. Keyword-based retrieval
5. Vector-based retrieval
6. Sparse representation
7. Dense representation
8. Sparse বনাম dense retrieval
9. Exact matching বনাম semantic matching

## B. Keyword / Lexical Retrieval

10. Keyword search কেন useful
11. Exact keyword matching
12. Term frequency (TF)
13. Inverse document frequency (IDF)
14. TF-IDF basic intuition
15. BM25
16. BM25 বনাম TF-IDF
17. BM25 কেন commonly ব্যবহার হয়
18. BM25 score intuition
19. Keyword search-এর limitations

(BM25 mathematics-এ বেশি গভীরে নয়; practical ও interview-level বোঝা)

## C. Vector Search বনাম Keyword Search

20. Vector search-এর strengths
21. Vector search-এর weaknesses
22. Keyword search-এর strengths
23. Keyword search-এর weaknesses
24. যেসব exact term vector search miss করতে পারে
25. যে semantic meaning keyword search miss করতে পারে
26. Product ID / error code / technical term
27. Synonym এবং paraphrased query
28. Typographical variation
29. Ambiguous query

## D. Hybrid Search

30. Hybrid Search কী?
31. কেন keyword + vector retrieval combine করা হয়?
32. Hybrid Search architecture
33. Query -> keyword retrieval
34. Query -> vector retrieval
35. দুই result set combine করা
36. Deduplication
37. Combined result ranking
38. Final Top-K selection

## E. Score Combination

39. কেন vector এবং keyword score সবসময় সরাসরি তুলনা করা যায় না
40. Score normalization
41. Min-Max normalization basics
42. Weighted score combination
43. Formula:

```text
combined_score = alpha * vector_score + (1 - alpha) * keyword_score
```

44. alpha-র অর্থ
45. High vector weight
46. High keyword weight
47. Weight নির্বাচন
48. Naive score combination-এর সমস্যা

## F. Reciprocal Rank Fusion (RRF)

49. RRF কী?
50. RRF কেন useful?
51. Rank-based fusion
52. কেন RRF-এ comparable raw score লাগে না
53. Basic RRF formula intuition: `RRF(rank) = 1 / (k + rank)`
54. Vector ranking + keyword ranking combine করা
55. RRF বনাম weighted score fusion
56. RRF-এর advantages
57. RRF-এর limitations

(জটিল RRF mathematics implement হবে না; concept ও practical use)

## G. Hybrid Retrieval Quality

58. Precision-এর উপর প্রভাব
59. Recall-এর উপর প্রভাব
60. False positives
61. False negatives
62. Retrieval noise
63. Top-K interaction
64. Threshold interaction
65. Hybrid search তবুও কেন fail করতে পারে
66. কখন hybrid search retrieval খারাপ করে
67. Query-dependent retrieval behavior

## H. Metadata Filtering বনাম Hybrid Search

68. Metadata filtering কী করে
69. Metadata filtering বনাম keyword search
70. Metadata filtering বনাম semantic search
71. Filtering কেন hybrid search-এর সমান নয়
72. Metadata filtering + hybrid retrieval একসাথে

## I. RAG Integration

73. RAG-এর ভিতরে Hybrid Search
74. Query processing
75. Keyword retrieval
76. Vector retrieval
77. Fusion
78. Deduplication
79. Final Top-K
80. Context construction
81. LLM generation

পুরো flow বুঝতে হবে।

---

# PART 3 - TOP 5 MUST-ANSWER QUESTIONS

সব concept শেখানোর পরে একটা একটা করে। প্রথমে Question 1; user `next` বললে Question 2। একসাথে ৫টা নয়।

1. Hybrid Search কী এবং কেন Vector Search-এর সাথে Keyword Search combine করা হয়?
2. BM25 কী এবং এটি Keyword Search-এ কীভাবে কাজ করে?
3. Vector Search বনাম Keyword Search - কোন ধরনের query-তে কোনটি ভালো কাজ করে?
4. Weighted Score Fusion বনাম Reciprocal Rank Fusion (RRF) - পার্থক্য কী?
5. Hybrid Search কীভাবে RAG retrieval quality improve করতে পারে, এবং এর limitations কী?

প্রতিটি উত্তর: বাংলা, সংক্ষিপ্ত, technical example, Interview Trap প্রয়োজনে।

---

# PART 4 - CODING PART (সব concept question শেষ হওয়ার পরে)

Existing flow যা ইতিমধ্যে আছে (reuse হবে, rebuild নয়):

```text
POST /ask
  -> query validation
  -> query embedding
  -> vector retrieval
  -> Top-K
  -> context construction
  -> LLM generation
  -> answer + sources
```

## Coding objective

Retrieval layer-কে practical Hybrid Retrieval দিয়ে extend করা।

## Target flow

```text
User Query
    -> Query Processing
    -> +--------------------+---------------------+
       | Vector Search      | Keyword Search      |
       | Dense Results      | BM25/Lexical Results|
       +--------------------+---------------------+
    -> Fusion
    -> Deduplication
    -> Final Ranking
    -> Top-K
    -> Context Construction
    -> RAG Generation
```

## Architecture expectation

```text
VectorRetrievalService
KeywordRetrievalService
        |
HybridRetrievalService
        |
RAG Orchestrator (RagService)
        |
Generation Service (AiService)
```

Retrieval logic LLM generation-এর সাথে tightly coupled হবে না।

---

## STEP 1 - Existing retrieval code inspect (কোড modify নয়)

চিহ্নিত করতে হবে এবং কী reuse হবে explain করতে হবে:

- current vector retrieval service
- database schema
- document/chunk structure
- embedding storage
- existing metadata
- current Top-K handling
- similarity threshold
- current query flow

## STEP 2 - Keyword retrieval implement

Basic lexical retrieval। Preferred: PostgreSQL full-text search (যদি project-এর জন্য appropriate)।

বুঝতে হবে: `tsvector`, `tsquery`, PostgreSQL full-text search, lexical matching, ranking (`ts_rank`)।

**BM25 নিয়ে নিয়ম:** যদি current PostgreSQL setup-এ BM25 native না থাকে, তাহলে fake BM25 বানানো যাবে না। বরং:

1. limitation explain করতে হবে
2. practical Day 2 implementation হিসেবে PostgreSQL FTS ব্যবহার করতে হবে
3. BM25 conceptual retrieval method হিসেবে থাকবে
4. ভবিষ্যতে Elasticsearch/OpenSearch বা অন্য suitable search layer দিয়ে BM25 architecture কীভাবে হতে পারে তা explain করতে হবে

অপ্রয়োজনীয় infrastructure যোগ করা যাবে না।

## STEP 3 - KeywordRetrievalService

Clean retrieval abstraction, vector retrieval থেকে independent।

- Input: query, topK, optional metadata filters
- Output: chunk ID, content, metadata, lexical/ranking score

## STEP 4 - VectorRetrievalService

Existing vector retrieval service reuse; দরকার না হলে rewrite নয়। Output: chunk ID, content, metadata, vector score/distance।

## STEP 5 - HybridRetrievalService

Responsibilities:

1. vector retrieval চালানো
2. keyword retrieval চালানো
3. দুই result set collect করা
4. chunk ID দিয়ে deduplicate করা
5. ranking signal combine করা
6. result rank করা
7. final Top-K apply করা
8. sources + scores return করা

Architecture clean রাখতে হবে।

## STEP 6 - Fusion strategy

প্রথমে **একটা** practical fusion method: preferred RRF।

```text
RRF(rank) = 1 / (k + rank)
```

Configurable RRF constant। Over-engineer নয়। Weighted score fusion কীভাবে কাজ করত তা conceptually বুঝতে হবে।

## STEP 7 - Configurable retrieval

Hardcode না করে configurable:

- vectorTopK
- keywordTopK
- finalTopK
- similarityThreshold
- RRF constant
- optional metadata filters

## STEP 8 - Result metadata

প্রতিটি final result debugging-এর জন্য যথেষ্ট তথ্য expose করবে:

```json
{
  "chunkId": "...",
  "content": "...",
  "metadata": {},
  "vectorScore": 0.0,
  "keywordScore": 0.0,
  "vectorRank": 1,
  "keywordRank": 2,
  "fusedScore": 0.0
}
```

শুধু appropriate field API response-এ যাবে; sensitive internal data expose নয়।

## STEP 9 - RAG integration

`POST /ask` update:

```text
validate query
  -> hybrid retrieval
  -> deduplicate
  -> final Top-K
  -> build context
  -> generate grounded answer
  -> return sources
```

Existing generation code reuse হবে।

## STEP 10 - No-result handling

Handle করতে হবে (system crash করবে না):

1. শুধু vector result
2. শুধু keyword result
3. দুটোই result
4. কোনো result নেই
5. low-quality vector result
6. low-quality keyword result
7. duplicate result

## STEP 11 - Logging

Log: query, vectorTopK, keywordTopK, finalTopK, threshold, vector result count, keyword result count, final result count, selected chunk IDs, ranking/fusion information।

Log করা যাবে না: password, API key, token, private credential, sensitive user data।

## STEP 12 - Testing (minimum)

- Test A: semantic query যেখানে vector search ভালো করবে
- Test B: exact keyword query (product ID, invoice ID, error code, technical term)
- Test C: paraphrased query
- Test D: exact term + semantic meaning দুটোই আছে এমন query
- Test E: matching information নেই এমন query
- Test F: vector + keyword result overlap করে এমন query
- Test G: vector search পায় কিন্তু keyword পায় না
- Test H: keyword search পায় কিন্তু vector পায় না

তুলনা: Vector-only বনাম Keyword-only বনাম Hybrid; observations record করতে হবে।

## STEP 13 - Basic evaluation

Measure: relevant results, irrelevant results, missed relevant results, precision, recall, retrieval noise। Advanced evaluation framework নয়।

---

# PART 5 - LEARNING/CODING STYLE

Concepts: বাংলায় ব্যাখ্যা -> concise কিন্তু technically accurate -> ছোট technical example -> Interview Trap -> অপ্রয়োজনীয় analogy নয় -> গুরুত্বপূর্ণ terminology skip নয়।

Coding: কী build করছি -> কেন -> কোন file/code area -> minimal code -> user implement করবে -> test -> review -> পরের step। পুরো project code একবারে dump নয়।

---

# PART 6 - DAY 2 SUCCESS CRITERIA

## Concepts - আত্মবিশ্বাসের সাথে explain করতে পারতে হবে

- lexical search
- semantic search
- sparse retrieval
- dense retrieval
- TF-IDF basics
- BM25 fundamentals
- vector বনাম keyword search
- hybrid search
- score normalization
- weighted fusion
- RRF
- metadata filtering বনাম keyword search
- precision/recall trade-offs
- hybrid retrieval failure cases
- RAG-এর ভিতরে hybrid search

## Code - যা support করতে হবে

- vector retrieval
- keyword retrieval
- hybrid retrieval
- configurable Top-K
- configurable threshold
- result deduplication
- fusion/ranking
- source metadata
- no-result handling
- retrieval logging
- basic retrieval tests
- Vector-only বনাম Keyword-only বনাম Hybrid comparison

## Important

Concepts এবং coding দুটোই সম্পূর্ণ না হওয়া পর্যন্ত Day 2 complete mark করা যাবে না। Concept section দিয়ে শুরু; coding তখনই শুরু হবে যখন TOP 5 প্রশ্ন সম্পূর্ণ।
