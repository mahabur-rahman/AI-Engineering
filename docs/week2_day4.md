# Week 2 - Day 4

## Retrieval Pipeline + Semantic Search

আজকের focus হলো stored document chunks থেকে user query-এর জন্য relevant chunks retrieve করা।

This is a concept-first day.

No coding yet.

সব MUST-LEARN concept এবং Q&A শেষ হওয়ার পরে user explicitly coding শুরু করতে বললে তবেই implementation শুরু হবে।

---

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Stack: Node.js, TypeScript, NestJS, PostgreSQL, pgvector, Prisma, Docker, Ollama, REST API
- Existing data: documents এবং chunks already stored by Week 2 Day 3 ingestion pipeline
- Embedding model: local Ollama `nomic-embed-text`
- Day 2 foundation: embeddings, vectors, cosine similarity, vector search, pgvector, HNSW
- Day 3 foundation: document cleaning, chunking, metadata, embedding validation, ingestion
- Scope: retrieval and semantic search only

---

## Day 4 learning goal

By the end of this day, I should confidently understand:

```text
User Query
    -> Query Validation
    -> Query Embedding
    -> Tenant and Access Filters
    -> Vector Similarity Search
    -> Top-K Retrieval
    -> Optional Similarity Threshold
    -> Chunk Content and Metadata
    -> Retrieval Results
```

I should be able to explain how retrieval works inside a RAG system without moving into answer generation.

---

## Day 4 working rules

- Theory/Q&A আগে, coding পরে
- প্রথমে শুধু complete concept/question checklist দেওয়া হবে
- User `next` বললে শুধু পরের question-এর answer দেওয়া হবে
- Previous question repeat করা যাবে না
- প্রতিটি answer বাংলায় concise কিন্তু technically complete হবে
- প্রয়োজন হলে ছোট technical example দেওয়া হবে
- প্রতিটি answer-এ `Interview Trap` থাকবে
- MUST-LEARN questions শেষ না হওয়া পর্যন্ত coding শুরু হবে না
- Advanced RAG, hybrid search, BM25, reranking, agents, এবং LLM answer generation এই দিনের scope-এর বাইরে
- Multi-tenant security এবং database-level filtering এই দিনের mandatory core topic

---

# PART 1 - MUST-LEARN CONCEPTS

## A. Retrieval Fundamentals

1. Retrieval কী?
2. RAG-এর retrieval stage কী?
3. Retrieval কেন প্রয়োজন?
4. Document retrieval এবং chunk retrieval-এর পার্থক্য কী?
5. Query এবং document-এর পার্থক্য কী?
6. Query embedding কী?
7. Query-এর জন্য embedding তৈরি করতে হয় কেন?
8. Query এবং document-এর জন্য একই embedding model ব্যবহার করতে হয় কেন?
9. Query vector কী?
10. Similarity search কীভাবে retrieval-এর অংশ হিসেবে কাজ করে?

## B. Vector Similarity Search

11. Cosine similarity কী?
12. Distance এবং similarity-এর পার্থক্য কী?
13. pgvector-এ cosine distance কীভাবে কাজ করে?
14. Similarity score গুরুত্বপূর্ণ কেন?
15. Top-K retrieval কী?
16. Top-K-তে K কী বোঝায়?
17. K কীভাবে নির্বাচন করতে হয়?
18. খুব ছোট K-এর সমস্যা কী?
19. খুব বড় K-এর সমস্যা কী?
20. Similarity threshold কী?
21. Top-K এবং similarity threshold-এর পার্থক্য কী?
22. Top-K এবং threshold একসাথে ব্যবহার করার সুবিধা কী?
23. Nearest chunk সবসময় correct chunk হয় না কেন?

## C. PostgreSQL এবং pgvector Retrieval

24. pgvector-এর vector operators কী?
25. Cosine distance operator কী?
26. Euclidean distance-এর basic ধারণা কী?
27. Inner product-এর basic ধারণা কী?
28. Text embeddings-এর জন্য কোন distance metric ব্যবহার করব এবং কেন?
29. `ORDER BY vector distance` retrieval-এ কীভাবে কাজ করে?
30. `LIMIT` কীভাবে Top-K implement করে?
31. Retrieval-এর সময় HNSW কীভাবে ব্যবহার হয়?
32. Exact search এবং approximate search-এর পার্থক্য কী?
33. Metadata filtering-এর সঙ্গে vector search কীভাবে combine হয়?
34. Database vector search application-side fake similarity calculation-এর চেয়ে ভালো কেন?

## D. Metadata Filtering এবং Security

35. Metadata filtering কেন প্রয়োজন?
36. `tenant_id` filtering কী?
37. `document_id` filtering কখন দরকার?
38. `source` filtering কীভাবে কাজে লাগে?
39. `version` filtering কেন দরকার?
40. Access-control filtering কী?
41. Authorization prompt-এর বাইরে enforce করতে হয় কেন?
42. Tenant isolation database বা retrieval layer-এ enforce করা জরুরি কেন?
43. Filter আগে, নাকি vector search-এর সঙ্গে filter করব?
44. Metadata filtering না থাকলে কী সমস্যা হতে পারে?
45. Multi-tenant vector search-এ cross-tenant data leakage কীভাবে হয়?
46. Application-level filtering এবং database-level filtering-এর পার্থক্য কী?
47. RBAC এবং retrieval filtering-এর relationship কী?
48. Client-এর পাঠানো `tenant_id` blindly trust করা যাবে না কেন?

## E. Complete Retrieval Pipeline

49. Query validation retrieval pipeline-এর প্রথম ধাপ কেন?
50. Query embedding থেকে final retrieval result পর্যন্ত complete flow কী?
51. Query embedding failure হলে pipeline কী করবে?
52. Invalid tenant context হলে কী করা উচিত?
53. No-result retrieval কীভাবে handle করতে হয়?
54. Retrieval pipeline-এ score এবং metadata কখন attach হয়?
55. Search এবং ingestion pipeline আলাদা রাখা হয় কেন?

## F. Retrieval Result Structure

56. একটি retrieval result-এ `chunk_id` কেন রাখা হয়?
57. `document_id` কেন দরকার?
58. `tenant_id` result-এ কেন useful?
59. `chunk_index` কেন দরকার?
60. `content` field-এর ভূমিকা কী?
61. Similarity score এবং distance score কীভাবে expose করব?
62. Source metadata কেন দরকার?
63. Page, section, এবং heading metadata কেন useful?
64. Document version result-এ রাখা কেন দরকার?
65. Retrieval response DTO কীভাবে design করব?

## G. Retrieval Quality

66. ভালো retrieval বলতে কী বোঝায়?
67. Relevant এবং irrelevant chunk কী?
68. False positive কী?
69. False negative কী?
70. Retrieval precision কী?
71. Retrieval recall কী?
72. Precision এবং recall-এর trade-off কী?
73. Top-K একা retrieval quality guarantee করে না কেন?
74. Retrieval evaluation দরকার কেন?
75. Retrieval result manually inspect কীভাবে করব?
76. Basic retrieval evaluation dataset কীভাবে তৈরি করব?
77. Relevant result না এলে কীভাবে debug করব?

## H. Query Processing

78. Query normalization কী?
79. Empty query validation কেন দরকার?
80. Very short query কীভাবে handle করব?
81. Very long query-এর সমস্যা কী?
82. Query embedding failure কীভাবে handle করব?
83. Query embedding dimension validation কেন দরকার?
84. Query এবং stored document embedding-এর model consistency কেন দরকার?
85. Different language query হলে কী বিবেচনা করতে হয়?
86. প্রতিটি query blindly rewrite করা উচিত নয় কেন?

## I. Multi-Tenant Retrieval Security

87. Tenant isolation কী?
88. Retrieval filter-এ `tenant_id` বাধ্যতামূলক করা কেন দরকার?
89. সব tenant-এর vector একসাথে search করলে কী হতে পারে?
90. Cross-tenant data leakage কী?
91. Database-level tenant filtering কীভাবে নিরাপত্তা বাড়ায়?
92. Application-level tenant filtering-এর ঝুঁকি কী?
93. শুধু LLM prompt-এ tenant restriction দেওয়া unsafe কেন?
94. RBAC permission retrieval result-এ কীভাবে apply হয়?
95. Tenant context না থাকলে search reject করা উচিত কেন?
96. Tenant isolation test কীভাবে design করব?

## J. Retrieval API Design

97. Semantic search endpoint কীভাবে design করব?
98. Search request DTO-তে কী fields থাকা উচিত?
99. `query` field কীভাবে validate করব?
100. `topK` field কীভাবে validate করব?
101. Optional metadata filters কীভাবে model করব?
102. Tenant context request-এর কোথা থেকে আসা উচিত?
103. Client-provided tenant context trust করা যাবে কি?
104. Search response DTO-তে কোন fields রাখা উচিত?
105. Retrieval API error handling কীভাবে design করব?
106. No-result response কেমন হওয়া উচিত?
107. Pagination এবং Top-K-এর basic relationship কী?
108. Retrieval latency-তে কোন বিষয়গুলো প্রভাব ফেলে?
109. Search endpoint-এর database failure কীভাবে handle করব?
110. Invalid filter এবং invalid authorization কীভাবে আলাদা করব?

---

# PART 2 - INTERVIEW-IMPORTANT CONCEPTS

নিচের বিষয়গুলো MUST-LEARN-এর পরে interview depth-এর জন্য revise করতে হবে:

- Retrieval বনাম generation
- Query embedding বনাম document embedding
- Cosine distance বনাম cosine similarity
- Lower distance এবং higher similarity interpretation
- Top-K selection trade-off
- Similarity threshold trade-off
- Exact search বনাম HNSW approximate search
- Filtered vector search
- Tenant isolation guarantee
- Prompt-level restriction বনাম database-level authorization
- Precision, recall, false positive, false negative
- No-result এবং low-confidence retrieval handling
- Retrieval latency এবং result explainability
- Search request/response DTO design
- Query validation এবং dimension consistency

---

# PART 3 - NICE-TO-KNOW CONCEPTS

এগুলো Day 4-এর core নয়, কিন্তু প্রয়োজন হলে সংক্ষেপে জানা যাবে:

- HNSW `ef_search` এবং recall trade-off
- HNSW `m` এবং index construction trade-off
- Vector normalization-এর basic effect
- Distance metric-এর model-specific behavior
- Keyset pagination-এর basic idea
- Retrieval score calibration-এর basic idea
- Filter selectivity এবং query planning-এর basic ধারণা
- Database `EXPLAIN` দিয়ে retrieval query inspect করা

এগুলো নিয়ে advanced implementation Day 4-এ করা হবে না।

---

# PART 4 - REQUIRED ANSWER FORMAT

প্রতিটি question-এর answer হবে concise Bangla format-এ:

## Question N: [Question]

### সংক্ষিপ্ত ব্যাখ্যা

Technically precise Bangla explanation।

### ছোট technical example

প্রয়োজন হলে SQL, TypeScript, vector বা request/response example।

### Interview Trap

Common ভুল assumption বা interviewer-এর follow-up risk।

### Checkpoint

এক লাইনের self-check।

User `next` বললে শুধু পরের unanswered question দেওয়া হবে।

---

# PART 5 - TARGET RETRIEVAL ARCHITECTURE

Concept/Q&A শেষ হওয়ার পরে যে retrieval architecture implement করা হবে:

```text
User Query
      |
      v
Validate Query and Tenant Context
      |
      v
Generate Query Embedding
      |
      v
Validate Embedding Dimension
      |
      v
Apply Tenant and Access Filters
      |
      v
PostgreSQL + pgvector Similarity Search
      |
      v
Order by Distance
      |
      v
Apply Top-K
      |
      v
Apply Optional Similarity Threshold
      |
      v
Return Chunk Content + Metadata + Score
```

এই দিন LLM answer generation করা হবে না। শুধু relevant chunks retrieve করা হবে।

---

# PART 6 - CODING SCOPE AFTER Q&A

Q&A শেষ এবং user explicitly coding শুরু করতে বলার পরে implementation phases হবে:

1. Existing `Document` এবং `DocumentChunk` data model review
2. Query embedding service review এবং validation
3. PostgreSQL + pgvector cosine retrieval query
4. Top-K validation এবং safe limits
5. Similarity threshold support
6. Tenant-aware metadata filtering
7. Document/source/version filters
8. Retrieval result DTO
9. `POST /search` API
10. Error handling এবং no-result behavior
11. Tenant isolation test
12. Retrieval quality test
13. Edge-case test
14. Build, endpoint verification এবং database cleanup

Hybrid search, BM25, reranking, query expansion, HyDE, agents, এবং full RAG generation এই coding scope-এর বাইরে থাকবে।

---

# PART 7 - DAY 4 COMPLETION CHECKLIST

- [ ] Retrieval concept বুঝি
- [ ] RAG retrieval stage explain করতে পারি
- [ ] Query embedding explain করতে পারি
- [ ] Same embedding model requirement explain করতে পারি
- [ ] Cosine distance এবং similarity explain করতে পারি
- [ ] Top-K এবং threshold-এর trade-off explain করতে পারি
- [ ] pgvector operators explain করতে পারি
- [ ] HNSW retrieval explain করতে পারি
- [ ] Metadata filtering explain করতে পারি
- [ ] Tenant isolation explain করতে পারি
- [ ] Prompt-level security যথেষ্ট নয় কেন explain করতে পারি
- [ ] Precision এবং recall basics explain করতে পারি
- [ ] Retrieval response structure design করতে পারি
- [ ] Query validation explain করতে পারি
- [ ] Search API design করতে পারি
- [ ] Query embedding works
- [ ] Vector search works
- [ ] Top-K works
- [ ] Metadata filtering works
- [ ] Tenant isolation tested
- [ ] Retrieval edge cases tested
- [ ] User explicitly coding শুরু করতে বলেছেন

---

## Day 4 final target

Day 4 শেষে আমি confidently বলতে পারব:

> A retrieval pipeline validates the query and tenant context, embeds the query with the same model used for stored documents, applies access-aware metadata filters, performs pgvector similarity search, returns controlled Top-K results with scores and traceable metadata, and prevents cross-tenant data leakage.
