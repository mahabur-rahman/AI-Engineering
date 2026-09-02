# Week 2 - Day 3

## Embedding Pipeline + Document Chunking + Ingestion Foundation

আজকের focus হবে document chunking, chunk metadata, embedding generation, validation, এবং vector database ingestion foundation।

This is a concept-first day.

No coding yet.

Concept/Q&A শেষ হওয়ার পরে user explicitly বললে তবেই coding section শুরু হবে।

---

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Stack: Node.js, TypeScript, NestJS, PostgreSQL, pgvector, Prisma, Docker, Ollama, REST API
- Local embedding model: `nomic-embed-text`
- Day 2 foundation: embeddings, vectors, cosine similarity, vector search, pgvector, HNSW, top-k retrieval
- Goal: production-quality understanding of document ingestion before coding
- Scope: Day 3 only

---

## Day 3 learning goal

By the end of this day, I should confidently understand this complete ingestion flow:

```text
Raw Document
    -> Cleaning
    -> Chunking
    -> Chunk Metadata
    -> Embedding Generation
    -> Validation
    -> PostgreSQL + pgvector Storage
```

I should be able to explain:

- why documents are split before embedding
- how chunk size and overlap affect retrieval quality
- how to preserve context at chunk boundaries
- what metadata belongs to a chunk
- how embedding generation is validated and handled when it fails
- how ingestion remains repeatable, updateable, and consistent
- why ingestion and search are separate application workflows

---

## Day 3 working rules

- Theory/Q&A আগে, coding পরে
- একবারে একটি question নিয়ে এগোতে হবে
- User `next` বললে শুধু পরের question দেওয়া হবে
- Previous question repeat করা যাবে না
- প্রতিটি question-এ Bangla explanation আগে থাকবে
- তারপর equivalent English explanation দিতে হবে
- তারপর ছোট technical example দিতে হবে
- তারপর interview-ready answer দিতে হবে
- শেষে `Interview Trap` দিতে হবে
- Unnecessary analogy ব্যবহার করা যাবে না
- Advanced RAG, reranking, hybrid search, agents, evaluation, এবং production optimization এই দিনের scope-এর বাইরে
- User explicitly `Day 3 coding part` না বলা পর্যন্ত coding শুরু করা যাবে না

---

# PART 1 - MUST-KNOW CONCEPT/Q&A LIST

নিচের 50টি question Day 3-এর complete core list। এগুলো document chunking এবং embedding ingestion foundation-এর interview-relevant ধারণাগুলো cover করে।

## A. Document এবং Chunking Fundamentals

### 1. কেন document chunk করতে হয়?

### 2. Document chunking কী?

### 3. Chunk এবং Document-এর মধ্যে পার্থক্য কী?

### 4. পুরো document-কে একবারে embed না করে chunk করা হয় কেন?

### 5. একটি ভালো chunk-এর বৈশিষ্ট্য কী?

### 6. Chunk size কী?

### 7. Chunk size এবং token count-এর মধ্যে পার্থক্য কী?

### 8. Character-based chunking কী?

### 9. Token-based chunking কী?

### 10. Sentence-based chunking কী?

### 11. Paragraph-based chunking কী?

### 12. Semantic chunking কী?

### 13. Fixed-size chunking কী?

## B. Chunk Size, Overlap, এবং Context

### 14. Chunk overlap কী?

### 15. Chunk overlap কেন দরকার?

### 16. Chunk overlap-এর trade-off কী?

### 17. খুব ছোট chunk-এর সমস্যা কী?

### 18. খুব বড় chunk-এর সমস্যা কী?

### 19. Chunk boundary problem কী?

### 20. Chunking-এর সময় context loss কীভাবে হয়?

### 21. Chunk size কীভাবে নির্বাচন করব?

### 22. Chunking strategy document type অনুযায়ী পরিবর্তন করা উচিত কেন?

## C. Chunk Metadata এবং Identity

### 23. Chunk-এর সঙ্গে কী metadata attach করা উচিত?

### 24. Document ID এবং Chunk ID-এর পার্থক্য কী?

### 25. Chunk ordering বা chunk index কেন দরকার?

### 26. Source metadata কী এবং কেন দরকার?

### 27. Tenant metadata কী এবং multi-tenant system-এ কেন গুরুত্বপূর্ণ?

### 28. Page number, section, heading, এবং document version metadata কীভাবে কাজে লাগে?

## D. Text Preparation এবং Embedding Input

### 29. কী text embed করা উচিত?

### 30. Metadata embed করা উচিত কি না?

### 31. Embedding-এর আগে preprocessing কী?

### 32. Text cleaning কী?

### 33. Duplicate content কীভাবে handle করব?

### 34. Empty chunk কী এবং এটি reject করা উচিত কেন?

### 35. Very short chunk-এর validation কীভাবে করব?

### 36. Code, table, list, এবং prose-এর জন্য একই chunking strategy ব্যবহার করা উচিত কি না?

## E. Embedding Generation Pipeline

### 37. Complete embedding generation pipeline কীভাবে কাজ করে?

### 38. Batch embedding কী?

### 39. Sequential embedding এবং batch embedding-এর মধ্যে পার্থক্য কী?

### 40. Embedding API বা local model failure হলে কী করা উচিত?

### 41. Retry strategy কী এবং retry কখন করা উচিত?

### 42. Rate limiting এবং local model limitation কী?

### 43. Embedding dimension validation কেন দরকার?

### 44. একই embedding model consistency কেন maintain করতে হয়?

### 45. Embedding result store করার আগে কী কী validation করা উচিত?

## F. Ingestion Lifecycle এবং Architecture

### 46. Idempotent ingestion কী?

### 47. Re-ingestion কী এবং কখন দরকার হয়?

### 48. Document update এবং delete করলে embeddings-এর কী হয়?

### 49. Stale embedding এবং document versioning কীভাবে handle করা যায়?

### 50. Complete Document -> Chunk -> Embedding -> Vector DB lifecycle এবং ingestion architecture কী?

---

# PART 2 - REQUIRED ANSWER FORMAT FOR EACH QUESTION

প্রতিটি question-এর উত্তর এই structure-এ দেওয়া হবে:

## Question N: [Question]

### Bangla explanation

সহজ কিন্তু technically precise Bangla explanation।

### English explanation

Interview এবং documentation-এর জন্য equivalent English explanation।

### Technical example

ছোট input/output, pseudo-flow, অথবা TypeScript/PostgreSQL-oriented example।

### Interview-ready answer

৩০-৬০ সেকেন্ডে বলা যায় এমন concise কিন্তু strong answer।

### Interview Trap

Common ভুল assumption, misleading answer, অথবা interviewer যে trade-off follow-up করতে পারেন।

### Checkpoint

Question বুঝেছি কি না যাচাই করার জন্য ছোট self-check।

---

# PART 3 - DAY 3 ARCHITECTURE

Concept/Q&A শেষ হওয়ার পরে যে architecture implement করা হবে:

```text
Raw Document
      |
      v
Text Cleaning
      |
      v
Chunking Strategy
      |
      v
Chunk Validation
      |
      v
Chunk Metadata Creation
      |
      v
Embedding Model (Ollama)
      |
      v
Embedding Validation
      |
      v
PostgreSQL + pgvector Storage
```

## Responsibility of each stage

### 1. Raw Document

Input হিসেবে title, source, tenant information, এবং document content আসবে।

### 2. Text Cleaning

Unnecessary whitespace, invalid control characters, এবং unusable formatting normalize করা হবে। Original source traceability বজায় রাখতে হবে।

### 3. Chunking Strategy

Document type এবং content structure অনুযায়ী chunk তৈরি হবে। Chunk size, overlap, sentence boundary, paragraph boundary, এবং context preservation বিবেচনা করা হবে।

### 4. Chunk Validation

Empty, duplicate, খুব ছোট, অথবা invalid chunk reject বা flag করা হবে।

### 5. Chunk Metadata Creation

Document ID, chunk ID, chunk index, source, tenant, page/section, version, এবং timestamps attach করা হবে।

### 6. Embedding Model

প্রতিটি valid chunk local Ollama embedding model-এ পাঠানো হবে। একই ingestion system-এ consistent model ব্যবহার করতে হবে।

### 7. Embedding Validation

Embedding array আছে কি না, সব value number কি না, expected dimension `768` কি না, এবং invalid value আছে কি না যাচাই করা হবে।

### 8. PostgreSQL + pgvector Storage

Chunk text, embedding vector, এবং metadata relational table-এ store হবে। Similarity search-এর জন্য pgvector vector column এবং HNSW index ব্যবহার করা হবে।

---

# PART 4 - SCOPE BOUNDARY

Day 3-এ intentionally cover করা হবে না:

- Advanced RAG orchestration
- Reranking
- Hybrid search
- Query expansion
- Agents এবং multi-agent workflow
- Retrieval evaluation framework
- Fine-tuning
- Production-scale queue optimization
- Distributed ingestion workers
- Advanced observability platform
- Multi-vector late interaction retrieval

এসব পরে roadmap-এর নির্দিষ্ট দিনে আসবে। Day 3-এর লক্ষ্য হলো reliable document ingestion foundation।

---

# PART 5 - CODING GATE

Coding শুরু করার আগে অবশ্যই:

- 50টি MUST-KNOW question complete করতে হবে
- প্রতিটি answer-এর Bangla, English, example, interview answer, এবং Interview Trap অংশ cover করতে হবে
- User-এর concept-related questions resolve করতে হবে
- User explicitly এই phrase বলতে হবে:

```text
Day 3 coding part
```

এর আগে কোনো implementation file edit করা যাবে না।

---

# PART 6 - DAY 3 COMPLETION CHECKLIST

- [ ] 50টি concept/Q&A complete
- [ ] Chunking methods-এর trade-off explain করতে পারি
- [ ] Chunk size এবং overlap justify করতে পারি
- [ ] Chunk metadata design করতে পারি
- [ ] Duplicate এবং empty chunk validation explain করতে পারি
- [ ] Embedding failure এবং retry behavior explain করতে পারি
- [ ] Dimension consistency explain করতে পারি
- [ ] Idempotent ingestion এবং re-ingestion explain করতে পারি
- [ ] Update, delete, stale embedding, এবং versioning explain করতে পারি
- [ ] Complete ingestion architecture whiteboard করতে পারি
- [ ] User explicitly coding শুরু করার অনুমতি দিয়েছে

---

## Day 3 final target

Day 3 শেষে আমি confidently বলতে পারব:

> A reliable embedding ingestion pipeline cleans a raw document, splits it into context-preserving validated chunks, attaches traceable metadata, generates and validates embeddings with a consistent model, and stores the result in PostgreSQL with pgvector in a repeatable way.
