# Week 2 - Day 5

## Keyword Search vs Semantic Search

আজকের মূল লক্ষ্য হলো keyword-based retrieval এবং embedding-based semantic retrieval-এর পার্থক্য গভীরভাবে বোঝা এবং একই document collection-এর উপর দুটো পদ্ধতি তুলনা করা।

আজকের শেষে আমি বুঝতে পারব:

- exact keyword search কীভাবে কাজ করে
- PostgreSQL full-text search কীভাবে কাজ করে
- semantic search কীভাবে meaning ব্যবহার করে
- কোন query-তে keyword search ভালো এবং কোন query-তে semantic search ভালো
- false positive এবং false negative কীভাবে তুলনা করতে হয়
- search quality কীভাবে manually এবং metric দিয়ে evaluate করতে হয়
- কেন Week 3-তে hybrid search দরকার হতে পারে

আজকের scope হলো comparison এবং evaluation। Hybrid search-এর full implementation Week 3-এর জন্য রাখা হবে।

---

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Stack: Node.js, NestJS, TypeScript, PostgreSQL, pgvector, Prisma, Ollama
- Embedding model: local `nomic-embed-text`
- Database: local PostgreSQL with `vector` extension
- Existing implementation: document ingestion, chunking, embeddings, tenant-aware semantic retrieval
- Previous milestone: Week 2 Day 4 retrieval pipeline completed
- Project: AI Business Copilot

---

## Day 5 working rules

- প্রথমে theory এবং comparison, তারপর practical experiment
- একই documents এবং একই queries দিয়ে keyword ও semantic search compare করতে হবে
- শুধু result count দেখে quality বিচার করা যাবে না
- exact identifier, invoice number, এবং code-এর ক্ষেত্রে keyword search-এর সুবিধা বিবেচনা করতে হবে
- paraphrase, synonym, এবং natural-language intent-এর ক্ষেত্রে semantic search-এর সুবিধা বিবেচনা করতে হবে
- tenant/access filter দুই search path-এই বাধ্যতামূলক রাখতে হবে
- search result দেখে model output-কে automatically correct ধরে নেওয়া যাবে না
- Hybrid Search, BM25 tuning, reranking, এবং query expansion আজ full implementation scope-এর বাইরে
- User `next` বললে unanswered question-এর পরেরটি দিতে হবে
- Previous question repeat করা যাবে না

---

# PART 1 - CORE MENTAL MODEL

## Keyword search flow

```text
User Query
    -> Query normalization
    -> Tokenization / term matching
    -> PostgreSQL text search
    -> Keyword rank
    -> Top results
```

Keyword search checks whether query terms, phrases, or normalized terms occur in the stored text.

## Semantic search flow

```text
User Query
    -> Query embedding
    -> Vector similarity comparison
    -> Tenant and access filters
    -> Cosine distance ordering
    -> Similarity threshold
    -> Top results
```

Semantic search compares meaning represented by vectors instead of requiring the same words.

## Main comparison

| বিষয় | Keyword search | Semantic search |
|---|---|---|
| Matching basis | Terms and phrases | Meaning and vector proximity |
| Exact identifiers | Usually strong | Can be unreliable |
| Synonyms | Limited unless configured | Usually stronger |
| Paraphrases | Often weak | Usually stronger |
| Explainability | High | Lower; score needs interpretation |
| Misspelled terms | Limited | May still retrieve related meaning |
| Numeric/reference queries | Strong with exact matching | Requires special care |
| Main failure | Wording mismatch | Wrong semantic neighbor |
| Typical cost | Lower | Embedding generation plus vector search |

Neither method is universally better. The query type and business requirement determine the appropriate method.

---

# PART 2 - MUST-LEARN CONCEPTS AND QUESTIONS

## A. Keyword Search Fundamentals

1. Keyword search কী?
2. Exact match এবং partial match-এর পার্থক্য কী?
3. `LIKE` query কীভাবে কাজ করে?
4. `%term%` pattern-এর সুবিধা এবং সমস্যা কী?
5. Case-insensitive search কী?
6. `ILIKE` কখন ব্যবহার করা হয়?
7. Phrase search কী?
8. Token এবং term-এর পার্থক্য কী?
9. Stop word কী?
10. Stemming কী?
11. Lemmatization এবং stemming-এর basic পার্থক্য কী?
12. PostgreSQL full-text search কী?
13. `tsvector` কী?
14. `tsquery` কী?
15. `to_tsvector()` কী করে?
16. `plainto_tsquery()` কী করে?
17. `websearch_to_tsquery()` কখন useful?
18. `@@` operator কীভাবে কাজ করে?
19. PostgreSQL text-search configuration কী?
20. Full-text search এবং `LIKE`-এর পার্থক্য কী?
21. `ts_rank()` কী?
22. Keyword result ranking কীভাবে করা যায়?
23. Text search index কেন দরকার?
24. GIN index full-text search-এ কীভাবে সাহায্য করে?
25. Keyword search-এর explainability semantic search-এর চেয়ে বেশি কেন?

## B. Semantic Search Fundamentals

26. Semantic search কী?
27. Query embedding কী?
28. Document chunk embedding কী?
29. Query এবং stored chunk একই embedding model-এ তৈরি করা দরকার কেন?
30. Cosine distance এবং cosine similarity-এর পার্থক্য কী?
31. pgvector `<=>` operator কী করে?
32. Lower cosine distance কী বোঝায়?
33. `1 - distance` similarity score হিসেবে ব্যবহার করার সীমাবদ্ধতা কী?
34. Similarity threshold কী?
35. Top-K retrieval এবং threshold একসাথে ব্যবহার করা হয় কেন?
36. Semantic search exact invoice number-এ ভুল করতে পারে কেন?
37. Semantic search synonym এবং paraphrase-এ ভালো কেন?
38. Embedding dimension consistency কেন গুরুত্বপূর্ণ?
39. Semantic search-এর প্রধান failure modes কী?
40. Semantic search result explain করা কঠিন কেন?

## C. Direct Comparison

41. `invoice INV-1001` query-তে কোন search method ভালো হতে পারে এবং কেন?
42. `payment has not arrived yet` query-তে কোন method ভালো হতে পারে এবং কেন?
43. Exact product code search-এ semantic search-এর ঝুঁকি কী?
44. Synonym query-তে keyword search-এর limitation কী?
45. Query-তে spelling error থাকলে দুটো method কীভাবে behave করতে পারে?
46. Short query এবং long natural-language query-তে কোন পার্থক্য হয়?
47. Numeric value এবং date search-এ semantic retrieval কেন সাবধানে ব্যবহার করতে হয়?
48. Same meaning কিন্তু different wording কীভাবে test করব?
49. Keyword search result না দিলে semantic search fallback হিসেবে ব্যবহার করা উচিত কি না?
50. Semantic result না দিলে keyword fallback কখন যুক্তিযুক্ত?
51. Search method নির্বাচন কি শুধুই accuracy-এর উপর নির্ভর করে?
52. Latency এবং infrastructure cost comparison কীভাবে করব?
53. Explainability এবং audit requirement থাকলে কোন method সুবিধাজনক?
54. User expectation অনুযায়ী search method নির্বাচন কীভাবে করব?
55. Search method-এর output একে অপরের replacement না হয়ে complementary হতে পারে কেন?

## D. Search Quality and Evaluation

56. Relevant result কী?
57. Irrelevant result কী?
58. False positive কী?
59. False negative কী?
60. Precision কী?
61. Recall কী?
62. Keyword search-এর precision সাধারণত বেশি হতে পারে কেন?
63. Semantic search-এর recall সাধারণত বেশি হতে পারে কেন?
64. Precision এবং recall-এর trade-off কী?
65. Top-K result manually inspect কীভাবে করব?
66. Query set কীভাবে তৈরি করব?
67. Exact-match test case কী?
68. Paraphrase test case কী?
69. Synonym test case কী?
70. No-match test case কী?
71. Cross-tenant leakage test কী?
72. Search result-এর expected document বা chunk label কেন দরকার?
73. Keyword এবং semantic result comparison table কীভাবে বানাব?
74. Search score alone quality guarantee করে না কেন?
75. Query category অনুযায়ী result quality report করা উচিত কেন?

## E. PostgreSQL and Performance

76. `LIKE` query index ব্যবহার নাও করতে পারে কেন?
77. Prefix search এবং contains search-এর পার্থক্য কী?
78. Full-text search index কখন ব্যবহার করা উচিত?
79. GIN index এবং pgvector HNSW index-এর উদ্দেশ্য কীভাবে আলাদা?
80. Exact keyword search-এর query plan কীভাবে inspect করব?
81. Vector search-এর query plan কীভাবে inspect করব?
82. `EXPLAIN ANALYZE` কেন ব্যবহার করব?
83. Dataset বড় হলে keyword এবং semantic latency কীভাবে compare করব?
84. Tenant filter index-এর প্রয়োজন কেন?
85. Search result pagination এবং Top-K-এর relationship কী?
86. Database-side ranking application-side ranking-এর চেয়ে ভালো কেন?

## F. Security and Business Rules

87. Keyword search-এ tenant filter কেন দরকার?
88. Semantic search-এ tenant filter কেন দরকার?
89. Client-provided tenant ID blindly trust করা যাবে না কেন?
90. Prompt-level access rule database authorization-এর replacement নয় কেন?
91. Search result-এ sensitive metadata ফেরত দেওয়া যাবে কি?
92. Exact invoice identifier search-এ authorization কীভাবে apply করব?
93. Search query log করলে PII risk কীভাবে তৈরি হতে পারে?
94. Malicious query এবং SQL injection কীভাবে prevent করব?
95. Raw SQL ব্যবহার করলে parameterization কেন জরুরি?
96. Cross-tenant comparison test কীভাবে design করব?

## G. API and Operational Design

97. Search request DTO-তে কোন fields থাকবে?
98. `searchMode` field রাখা উচিত কি না?
99. `keyword`, `semantic`, এবং future `hybrid` mode কীভাবে আলাদা করা যায়?
100. Search response-এ method বা score type ফেরত দেওয়া useful কেন?
101. No-result response কীভাবে design করব?
102. Invalid query এবং no-match result-এর পার্থক্য কী?
103. Search timeout হলে কী response দেওয়া উচিত?
104. Embedding service unavailable হলে semantic search কী করবে?
105. Keyword search সফল কিন্তু semantic search unavailable হলে fallback করা উচিত কি?
106. Search latency এবং result count কীভাবে observe করব?
107. Search mode change করলে evaluation আবার চালানো দরকার কেন?
108. Prompt বা RAG generation-এর আগে retrieval result কীভাবে inspect করব?

---

# PART 3 - REQUIRED LEARNING SEQUENCE

## Step 1: Existing semantic search review

Review করবে:

- query validation
- query embedding generation
- tenant filtering
- cosine distance ordering
- top-K limit
- similarity threshold
- result metadata

নিজের ভাষায় লিখবে:

```text
Query -> embedding -> tenant filter -> vector distance -> threshold -> top-K
```

## Step 2: Start with `LIKE`

এই ধরনের query manually compare করবে:

```sql
SELECT id, content
FROM "DocumentChunk"
WHERE "tenantId" = 'tenant-a'
  AND content ILIKE '%refund%';
```

শিখবে:

- exact word থাকলে result পাওয়া যায়
- synonym থাকলে result নাও আসতে পারে
- `%term%` বড় table-এ expensive হতে পারে
- tenant condition বাদ দেওয়া যাবে না

## Step 3: Learn PostgreSQL full-text search

Conceptually বুঝবে:

```sql
SELECT id, content,
       ts_rank(to_tsvector('english', content),
               plainto_tsquery('english', 'refund payment')) AS rank
FROM "DocumentChunk"
WHERE "tenantId" = 'tenant-a'
  AND to_tsvector('english', content)
      @@ plainto_tsquery('english', 'refund payment')
ORDER BY rank DESC;
```

নিজের ভাষায় explain করবে:

- document text কীভাবে searchable representation হয়
- query কীভাবে tsquery হয়
- `@@` কীভাবে match করে
- `ts_rank` কীভাবে ordering-এ সাহায্য করে
- language configuration কেন result বদলাতে পারে

## Step 4: Build a comparison dataset

কমপক্ষে এই category-গুলো রাখতে হবে:

| Category | Example query | Expected observation |
|---|---|---|
| Exact identifier | `INV-1001` | Keyword should be strong |
| Exact phrase | `billing page` | Both may work |
| Synonym | `reimbursement` vs `refund` | Semantic may help |
| Paraphrase | `money has not arrived` | Semantic may help |
| Numeric value | `2500` | Keyword needs care |
| Date | `due on August 20` | Exact filtering may be better |
| No match | `office parking policy` | Both should return no useful result |
| Wrong tenant | same query, another tenant | Must return no protected result |

প্রতিটি case-এ লিখবে:

- query
- expected relevant chunk
- keyword result
- semantic result
- false positive
- false negative
- better method
- reason

## Step 5: Compare result quality

এই table format ব্যবহার করবে:

| Query | Expected chunk | Keyword rank | Semantic rank | Keyword relevant? | Semantic relevant? |
|---|---|---:|---:|---|---|
| refund status | chunk-1 | 1 | 1 | yes | yes |

শুধু score নয়, content relevance বিচার করবে।

## Step 6: Compare performance

মাপবে:

- total request latency
- query preparation latency
- embedding generation latency
- database query latency
- result count
- empty-result rate

Small local dataset-এ performance difference production conclusion হিসেবে ব্যবহার করা যাবে না। Dataset size এবং hardware লিখে রাখতে হবে।

## Step 7: Decide the boundary

আজকের শেষে লিখবে:

- exact identifiers-এর জন্য keyword কেন useful
- natural-language intent-এর জন্য semantic কেন useful
- auditability-তে keyword-এর সুবিধা
- paraphrase handling-এ semantic-এর সুবিধা
- কোন case-এ দুটো একসাথে দরকার হতে পারে

শেষ point-টি Week 3 Hybrid Search-এর prerequisite, কিন্তু আজ full hybrid implementation করা হবে না।

---

# PART 4 - PRACTICAL CHECKLIST

- [ ] Existing semantic search endpoint কাজ করছে
- [ ] At least one tenant-a document stored আছে
- [ ] At least one tenant-b document stored আছে
- [ ] `LIKE` query দিয়ে exact term search করা হয়েছে
- [ ] `ILIKE` behavior দেখা হয়েছে
- [ ] PostgreSQL `tsvector` concept বুঝেছি
- [ ] `tsquery` concept বুঝেছি
- [ ] `@@` operator বুঝেছি
- [ ] `ts_rank` concept বুঝেছি
- [ ] Keyword এবং semantic result একই queries-এ compare করেছি
- [ ] Exact identifier case test করেছি
- [ ] Synonym case test করেছি
- [ ] Paraphrase case test করেছি
- [ ] No-match case test করেছি
- [ ] Numeric/date case test করেছি
- [ ] Tenant isolation case test করেছি
- [ ] False positive এবং false negative note করেছি
- [ ] Precision এবং recall-এর basic comparison লিখেছি
- [ ] Latency measurement limitations note করেছি
- [ ] Week 3 hybrid search কেন দরকার হতে পারে explain করেছি

---

# PART 5 - REQUIRED ANSWER FORMAT

প্রতিটি question-এর answer এই format-এ হবে:

## Question N: [Question]

### সংক্ষিপ্ত বাংলা ব্যাখ্যা

Technically precise Bangla explanation।

### English explanation

Interview এবং documentation-এর জন্য equivalent explanation।

### Technical example

ছোট SQL, vector, API, বা TypeScript example।

### Keyword বনাম Semantic comparison

এই concept দুটো search method-এ কীভাবে behave করে।

### Interview-ready answer

৩০-৬০ সেকেন্ডে বলা যায় এমন concise কিন্তু strong answer।

### Interview Trap

Common ভুল assumption এবং possible follow-up।

### Checkpoint

নিজে বুঝেছি কি না যাচাই করার জন্য ছোট task বা question।

User `next` বললে শুধু পরের unanswered question-এর answer দেওয়া হবে।

---

# PART 6 - INTERVIEW-READY TOPICS

এই প্রশ্নগুলোর উত্তর নিজের ভাষায় দিতে পারতে হবে:

1. Keyword search এবং semantic search-এর মূল পার্থক্য কী?
2. Invoice number search-এ semantic search-এর উপর একা নির্ভর করা ঝুঁকিপূর্ণ কেন?
3. Synonym এবং paraphrase-এর ক্ষেত্রে semantic search কেন ভালো?
4. PostgreSQL full-text search `LIKE`-এর চেয়ে কী সুবিধা দেয়?
5. `tsvector`, `tsquery`, এবং `@@` কী?
6. `ts_rank` কীভাবে result ordering-এ সাহায্য করে?
7. Semantic similarity score কীভাবে interpret করবে?
8. Precision এবং recall-এর trade-off কী?
9. Search quality evaluate করার জন্য dataset কীভাবে বানাবে?
10. Tenant isolation keyword এবং semantic দুই path-এই কেন enforce করতে হবে?
11. কখন keyword fallback ব্যবহার করবে?
12. কখন hybrid search প্রয়োজন হতে পারে?

---

# PART 7 - SCOPE BOUNDARY

আজ intentionally full implementation করা হবে না:

- BM25 tuning
- Full hybrid scoring formula
- Reciprocal Rank Fusion
- Cross-encoder reranking
- Query expansion
- Query rewriting with an LLM
- Advanced typo correction
- Distributed search cluster
- Production-scale benchmark
- RAG answer generation
- Agent workflow

এগুলো পরবর্তী RAG এবং advanced retrieval phase-এ আসবে। আজকের লক্ষ্য হলো search method-এর behavior বুঝে evidence-based decision নেওয়া।

---

# PART 8 - DAY 5 DONE CRITERIA

Day 5 সম্পন্ন হবে যখন:

- আমি keyword এবং semantic search নিজের ভাষায় explain করতে পারি
- `LIKE` এবং PostgreSQL full-text search-এর পার্থক্য বলতে পারি
- `tsvector`, `tsquery`, `@@`, এবং `ts_rank` বুঝি
- একই query set-এ keyword ও semantic result compare করেছি
- exact, synonym, paraphrase, numeric, date, no-match এবং tenant cases test করেছি
- false positive এবং false negative identify করেছি
- precision/recall-এর basic trade-off explain করতে পারি
- tenant/access filter দুই retrieval method-এ রাখার কারণ জানি
- search score একা quality guarantee করে না বুঝি
- keyword, semantic, এবং future hybrid approach কখন ব্যবহার করব বলতে পারি
- Week 3 Hybrid Search শুরু করার মতো notes এবং comparison dataset তৈরি আছে

Final review question:

> “একটি multi-tenant invoice system-এ invoice ID, customer question, refund synonym, এবং exact amount search করতে হলে keyword ও semantic search কীভাবে নির্বাচন বা combine করবে?”

এই প্রশ্নের উত্তরে accuracy, recall, precision, latency, explainability, authorization, এবং tenant isolation একসাথে আলোচনা করতে হবে।