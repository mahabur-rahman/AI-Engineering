# Week 2 - Day 6

## RAG Evaluation, Reliability, and Production Hardening

আজকের লক্ষ্য হলো Week 2 Day 5-এর RAG generation flow-কে test, evaluate, এবং reliability-এর দিক থেকে শক্ত করা। আজ নতুন agent, hybrid search, reranking, বা advanced retrieval implement করা হবে না।

আজকের focus:

```text
Stored Documents
    -> Retrieval
    -> Context Construction
    -> Grounded Prompt
    -> LLM Answer
    -> Source Verification
    -> Evaluation and Failure Notes
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
- Hybrid search, reranking, query expansion, agents, এবং fine-tuning আজকের scope-এর বাইরে

---

# PART 1 - DAY 6 LEARNING GOALS

আজকের শেষে আমি বুঝতে পারব:

1. RAG answer quality কীভাবে evaluate করতে হয়
2. Retrieval failure এবং generation failure-এর পার্থক্য
3. Grounded answer এবং fluent hallucination-এর পার্থক্য
4. Relevant context থাকা সত্ত্বেও answer ভুল হতে পারে কেন
5. No-context, low-similarity, এবং wrong-context case কীভাবে আলাদা করা যায়
6. Source metadata answer traceability-তে কীভাবে সাহায্য করে
7. Tenant isolation কীভাবে test করতে হয়
8. Deterministic prompt এবং low-temperature setting evaluation-এ কেন useful
9. Latency, result count, context size, এবং answer quality কীভাবে record করতে হয়
10. RAG regression test কেন দরকার

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

## Step 1: Run existing focused tests

```bash
npm test -- --runInBand src/ai/ai.service.spec.ts src/ai/rag/rag.service.spec.ts src/ai/rag/context-builder.spec.ts
```

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