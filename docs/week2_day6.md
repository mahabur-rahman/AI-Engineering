# Week 2 - Day 6

## RAG Pipeline Integration

আজকের মূল লক্ষ্য হলো Week 2 Day 1 থেকে Day 5 পর্যন্ত শেখা সবকিছু একসাথে একটি working end-to-end RAG pipeline-এ integrate করা। Day 5-এর retrieval, context construction, এবং generation implementation reuse করা হবে; অপ্রয়োজনীয়ভাবে সবকিছু নতুন করে লেখা হবে না।

আজকের focus:

```text
Document -> Chunk -> Embedding -> Vector DB
    -> User Query
    -> Query Embedding
    -> Tenant-aware Retrieval
    -> Context Construction
    -> Grounded Prompt
    -> Ollama Answer
    -> Sources
```

---

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Stack: Node.js, NestJS, TypeScript, PostgreSQL, pgvector, Prisma, Ollama
- Embedding model: local `nomic-embed-text`
- Generation model: local Ollama model configured in `.env.local`
- Previous milestone: Week 2 Day 5 RAG endpoint completed
- Project: AI Business Copilot

---

## Day 6 working rules

- একই documents এবং tenant context দিয়ে repeatable test চালাতে হবে
- শুধু answer ভালো শোনাচ্ছে কি না দিয়ে quality বিচার করা যাবে না
- Retrieval result, context, prompt, answer, এবং sources আলাদা করে inspect করতে হবে
- Unsupported question-এ confident invention গ্রহণযোগ্য নয়
- Tenant isolation সব test-এ বাধ্যতামূলক
- LLM answer-কে automatically ground truth ধরে নেওয়া যাবে না
- Test failure হলে আগে failure category লিখতে হবে, তারপর code change করতে হবে
- আজকের scope integration-focused থাকবে
- Reranking, hybrid search, query expansion, multi-query retrieval, HyDE, agentic RAG, fine-tuning, advanced evaluation, এবং multi-agent systems আজকের scope-এর বাইরে

---

# PART 1 - DAY 6 INTEGRATION CONCEPTS

আজ coding-এর আগে এই conceptগুলো অবশ্যই বুঝতে হবে:

1. End-to-end RAG architecture
2. Complete RAG pipeline
3. Ingestion pipeline বনাম query pipeline
4. Document -> chunk -> embedding -> vector database
5. User query -> embedding -> retrieval -> context -> LLM
6. Retrieval service বনাম generation service
7. RAG service বা orchestrator-এর ভূমিকা
8. Separation of responsibilities
9. RAG request এবং response flow
10. Source metadata এবং traceability
11. Tenant-aware retrieval
12. Basic RAG error handling
13. No-result handling
14. LLM failure handling
15. Retrieval failure handling
16. Basic RAG observability এবং logging
17. End-to-end RAG pipeline testing

## Integration mental model

```text
Ingestion pipeline:
Raw document -> cleaning -> chunks -> embeddings -> pgvector

Query pipeline:
Question -> validation -> query embedding -> retrieval -> context
                    -> grounded prompt -> Ollama -> answer + sources
```

## Responsibility boundaries

| Component | Responsibility |
|---|---|
| Ingestion service | Document clean, chunk, embed, এবং store করা |
| Retrieval service | Query embed করে tenant-scoped relevant chunks ফেরত দেওয়া |
| Context builder | Duplicate বাদ দিয়ে bounded context তৈরি করা |
| Generation service | Grounded prompt দিয়ে Ollama answer তৈরি করা |
| RAG service | পুরো flow orchestrate করা |
| Controller | Request নেওয়া এবং response ফেরত দেওয়া |

## Expected request/response flow

```http
POST /ask
```

```json
{
    "question": "How do I request a refund?",
    "tenantId": "tenant-a",
    "topK": 5
}
```

```json
{
    "answer": "...",
    "sources": [
        {
            "documentId": "...",
            "chunkId": "...",
            "tenantId": "tenant-a",
            "similarity": 0.89
        }
    ]
}
```

## Basic error boundaries

- Invalid question বা tenant হলে request reject হবে
- Retrieval failure হলে safe API error হবে
- No useful context হলে LLM call না করে fallback answer হবে
- Ollama failure বা timeout হলে gateway/service error হবে
- Source metadata answer-এর সঙ্গে traceable থাকবে
- Basic logs-এ query flow, result count, context size, এবং failure category রাখা যাবে; sensitive content অযথা log করা যাবে না

---

# PART 2 - MUST-MASTER TOP 5

এই পাঁচটি interview question একবারে একটি করে study করা হবে। User `next` বললে শুধু পরের unanswered question দেওয়া হবে।

1. End-to-end RAG pipeline-এর ingestion এবং query flow কীভাবে কাজ করে?
2. Retrieval service, context builder, generation service, এবং RAG orchestrator-এর দায়িত্ব কীভাবে আলাদা করবে?
3. Tenant-aware retrieval এবং source metadata RAG system-এ কেন গুরুত্বপূর্ণ?
4. No-result, retrieval failure, এবং LLM failure হলে RAG API কীভাবে behave করা উচিত?
5. একটি end-to-end RAG pipeline কীভাবে test এবং debug করবে?

প্রতিটি answer হবে:

- বাংলায় সংক্ষিপ্ত explanation
- ছোট technical example
- interview-ready answer
- প্রয়োজন হলে Interview Trap

আজ পাঁচটির বেশি interview question দেওয়া হবে না, যদি না আমি explicitly আরও চাই।

---

# PART 3 - DAY 6 LEARNING GOALS

আজকের শেষে আমি বুঝতে পারব:

1. সম্পূর্ণ RAG request flow নিজের ভাষায় explain করতে পারব
2. Ingestion এবং query pipeline আলাদা করতে পারব
3. Retrieval এবং generation responsibility আলাদা করতে পারব
4. RAG orchestrator-এর প্রয়োজন ব্যাখ্যা করতে পারব
5. Tenant-scoped sources সহ response design করতে পারব
6. No-result, retrieval failure, এবং LLM failure handle করতে পারব
7. End-to-end API test চালাতে পারব
8. Retrieval failure এবং generation failure আলাদা করতে পারব
9. Grounded answer এবং fluent hallucination-এর পার্থক্য বুঝতে পারব
10. Basic logs এবং regression cases record করতে পারব

---

# PART 2 - MUST-LEARN CONCEPTS

## A. RAG Evaluation Fundamentals

1. RAG evaluation কী?
2. Retrieval quality এবং answer quality-এর পার্থক্য কী?
3. Groundedness কী?
4. Faithfulness কী?
5. Relevance কী?
6. Citation বা source traceability কী?
7. False positive এবং false negative কীভাবে RAG answer-এ দেখা যায়?
8. Fluent answer সবসময় correct answer নয় কেন?
9. Search score একা quality guarantee করে না কেন?
10. Human evaluation কখন দরকার?

## B. Failure Categories

11. Retrieval miss কী?
12. Wrong semantic neighbor কী?
13. Irrelevant context কী?
14. Duplicate context কীভাবে answer quality কমাতে পারে?
15. Context truncation কী?
16. Answer-not-in-context case কী?
17. Prompt injection inside retrieved data কী?
18. Source mismatch কী?
19. Cross-tenant leakage কী?
20. LLM timeout বা provider failure কীভাবে আলাদা করে record করব?

## C. Test Design

21. Golden question কী?
22. Answerable question কী?
23. Unsupported question কী?
24. Paraphrase test কী?
25. Exact identifier test কী?
26. Multi-chunk answer test কী?
27. Duplicate chunk test কী?
28. Low-similarity test কী?
29. Empty retrieval test কী?
30. Tenant-isolation test কী?

## D. Operational Reliability

31. RAG request latency কীভাবে measure করব?
32. Retrieval latency এবং generation latency আলাদা করে মাপা দরকার কেন?
33. Context character limit এবং token budget-এর relationship কী?
34. Ollama timeout কেন দরকার?
35. LLM failure হলে API কী response দেবে?
36. Source metadata response-এ রাখা কেন দরকার?
37. Query এবং answer log করলে privacy risk কী?
38. Deterministic generation evaluation-এ কী সুবিধা দেয়?
39. Regression test কখন চালানো উচিত?
40. Production-এ model বা prompt পরিবর্তনের আগে কী verify করা উচিত?

---

# PART 3 - REQUIRED TEST DATASET

কমপক্ষে দুই tenant-এর document রাখতে হবে:

| Case | Query | Expected behavior |
|---|---|---|
| Direct answer | `How do I request a refund?` | Context থেকে supported answer |
| Paraphrase | `Where can I ask for my money back?` | Semantic retrieval relevant chunk আনবে |
| Exact identifier | `What is the status of INV-1001?` | Correct invoice source দরকার |
| Multi-chunk | `What are the refund steps and review time?` | একাধিক chunk ব্যবহার হতে পারে |
| Unsupported | `What is the office parking policy?` | Grounded fallback answer |
| Wrong tenant | Same query with another tenant | Protected result ফেরত দেওয়া যাবে না |
| Duplicate | Repeated same content chunks | Context-এ একবার থাকবে |
| Long context | Many retrieved chunks | Configured limit অতিক্রম করবে না |

প্রতিটি case-এ record করতে হবে:

- question
- tenant
- retrieved chunk IDs
- similarity scores
- final context size
- answer
- source IDs
- expected behavior
- pass/fail
- failure category

---

# PART 4 - CODING IMPLEMENTATION

## Expected architecture

```text
POST /ask
    -> Request DTO and query validation
    -> RAG Service / Orchestrator
    -> Existing query embedding logic
    -> Tenant-scoped vector retrieval
    -> Top-K and similarity filtering
    -> Duplicate removal
    -> Bounded context construction
    -> Grounded RAG prompt
    -> Ollama generation
    -> Answer and source metadata
```

## Coding checklist

- [ ] RAG module এবং dependency wiring
- [ ] RAG controller
- [ ] Request DTO বা runtime request validation
- [ ] Question এবং tenant validation
- [ ] Existing retrieval service integration
- [ ] Existing query embedding integration
- [ ] Top-K এবং similarity threshold
- [ ] Tenant-aware retrieval
- [ ] Chunk filtering এবং duplicate handling
- [ ] Context size control
- [ ] Structured RAG prompt এবং delimiters
- [ ] Ollama integration
- [ ] Grounded answer generation
- [ ] Source metadata response
- [ ] No relevant context handling
- [ ] Retrieval error handling
- [ ] LLM error এবং timeout handling
- [ ] Basic request, result count, context size, এবং failure logging
- [ ] End-to-end testing

## Step-by-step coding workflow

প্রতিটি step-এ এই sequence অনুসরণ করতে হবে:

1. কী build করছি তা explain করা
2. কেন দরকার তা explain করা
3. শুধু প্রয়োজনীয় code দেখানো
4. আমি implementation করব
5. আমি test চালাব
6. Code বা output review করা হবে
7. Verification সফল হলে পরের step-এ যাওয়া হবে

পুরো project dump করা যাবে না এবং working Day 4/Day 5 code অপ্রয়োজনীয়ভাবে rewrite করা যাবে না।

## Step 1: Run existing focused tests

```bash
npm test -- --runInBand src/ai/ai.service.spec.ts src/ai/rag/rag.service.spec.ts src/ai/rag/context-builder.spec.ts
```

## Step 1 checkpoint

Existing Day 5 RAG tests pass না করলে integration test-এ যাওয়া যাবে না।

## Step 2: Verify the complete local stack

```bash
docker compose up -d postgres pgadmin
npx prisma db push
ollama serve
npm run start:dev
```

## Step 3: Ingest controlled test documents

Use `tenant-a` and `tenant-b` documents with different invoice or support facts. Keep the content small and known so every expected answer can be manually verified.

## Step 4: Test the `/ask` endpoint

Test:

- answerable question
- paraphrase
- unsupported question
- wrong tenant
- invalid request
- LLM unavailable or timeout

## Step 5: Inspect retrieval and source behavior

Verify:

- tenant filter is passed to semantic retrieval
- result order follows similarity order
- duplicate content is removed
- context stays within the configured limit
- returned sources match the context chunks

## Step 6: Add regression tests

Regression tests should cover:

- grounded answer path
- empty retrieval path
- duplicate removal
- context budget
- invalid `topK`
- LLM failure mapping
- source metadata
- tenant isolation at the retrieval boundary

## Step 7: Verify the complete coding checklist

শেষে নিশ্চিত করতে হবে:

- Request DTO invalid input reject করছে
- Retrieval service এবং generation service আলাদা responsibility রাখছে
- RAG service শুধু orchestration করছে
- Sources context-এর সঙ্গে consistent
- Retrieval এবং LLM failure আলাদা error হিসেবে বোঝা যাচ্ছে
- Basic logs-এ sensitive document content leak হচ্ছে না
- End-to-end answer এবং no-result behavior predictable

## Manual endpoint test commands

```bash
docker compose up -d postgres pgadmin
npx prisma db push
ollama serve
npm run start:dev
```

তারপর document ingest করে `/ask` endpoint test করতে হবে:

```bash
curl -X POST http://localhost:3000/vectors/ingest \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Refund Policy",
        "tenantId": "tenant-a",
        "content": "Customers can request refunds from the billing page. Refunds are reviewed within five business days."
    }'
```

```bash
curl -X POST http://localhost:3000/ask \
    -H "Content-Type: application/json" \
    -d '{
        "question": "How can I request a refund?",
        "tenantId": "tenant-a",
        "topK": 5,
        "minSimilarity": 0.3
    }'
```

এই test cases চালাতে হবে:

1. Answer আছে এমন question
2. Answer নেই এমন question
3. Multiple relevant chunks
4. Duplicate বা overlapping chunks
5. Empty question
6. Retrieval failure
7. LLM failure বা timeout

---

# PART 5 - REQUIRED ANSWER FORMAT

প্রতিটি concept-এর answer এই format-এ হবে:

## Question N: [Question]

### সংক্ষিপ্ত বাংলা ব্যাখ্যা

Technically precise Bangla explanation।

### Technical example

ছোট API, test, SQL, অথবা retrieval example।

### Interview-ready answer

৩০-৬০ সেকেন্ডে বলা যায় এমন concise answer।

### Interview Trap

Common ভুল assumption বা follow-up risk।

### Checkpoint

নিজে বুঝেছি কি না যাচাই করার ছোট task।

User `next` বললে শুধু পরের unanswered question-এর answer দেওয়া হবে।

---

# PART 6 - DAY 6 SUCCESS CRITERIA

Day 6 সম্পন্ন হবে যখন:

- [ ] RAG retrieval এবং generation failure আলাদা করতে পারি
- [ ] Groundedness, faithfulness, এবং relevance explain করতে পারি
- [ ] Answerable, paraphrase, exact identifier, unsupported, এবং wrong-tenant test চালিয়েছি
- [ ] Retrieved chunk IDs এবং source metadata inspect করেছি
- [ ] Context budget verify করেছি
- [ ] Empty retrieval behavior verify করেছি
- [ ] LLM failure এবং timeout behavior verify করেছি
- [ ] Tenant isolation test করেছি
- [ ] Regression tests pass করেছে
- [ ] Failure cases লিখে রেখেছি
- [ ] Day 5 RAG implementation-এর known limitations document করেছি

## Final review question

> একটি RAG endpoint relevant document retrieve করলেও কীভাবে ভুল বা hallucinated answer দিতে পারে? Retrieval, context construction, prompt, model generation, source verification, এবং evaluation ব্যবহার করে debugging approach ব্যাখ্যা করো।

## Day 6 final target

Day 6 শেষে আমি confidently বলতে পারব:

> A reliable RAG system is evaluated at both retrieval and generation stages. It validates tenant scope, preserves traceable sources, bounds context, rejects unsupported claims, handles failures and timeouts, and uses repeatable test cases to detect regressions.