# Week 3 — Day 5

## HyDE (Hypothetical Document Embeddings)

আজকের লক্ষ্য হলো কীভাবে LLM দিয়ে একটি hypothetical answer/document তৈরি করে সেটিকে embed করে আরও relevant real documents retrieve করা যায় তা বোঝা।

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0; paid API নয়
- Stack: NestJS, TypeScript, PostgreSQL + pgvector, Ollama, Prisma
- Existing retrieval: vector search, PostgreSQL full-text keyword search, RRF hybrid fusion
- Existing RAG flow: `/ask` → multi-query retrieval → candidate merge → reranking → context construction → Ollama answer
- Existing local embedding model: `nomic-embed-text`
- Existing local generation model: configured through `OLLAMA_MODEL`
- Project: AI Business Copilot

---

## Must-Learn Concepts

### A. HyDE Fundamentals

1. What is HyDE?
2. Why HyDE is used in RAG
3. Limitations of traditional query embedding
4. Hypothetical Document কী?
5. Query Embedding বনাম Hypothetical Document Embedding
6. How HyDE works

### B. HyDE Pipeline

7. User Query
8. Hypothetical Document Generation
9. Hypothetical Document Embedding
10. Vector Search
11. Retrieved Real Documents
12. Context Construction
13. Final Answer Generation

### C. HyDE বনাম Traditional Retrieval

14. Traditional Vector Retrieval বনাম HyDE
15. Query-to-Document Matching
16. Semantic Gap
17. Why hypothetical documents can improve retrieval
18. HyDE বনাম Query Expansion
19. HyDE বনাম Multi-Query Retrieval

### D. Benefits and Limitations

20. Retrieval Recall improvement
21. Domain-specific retrieval
22. Hypothetical Document Hallucination
23. Why HyDE does not guarantee correctness
24. Retrieval Noise
25. When HyDE performs poorly
26. Latency and token cost

### E. RAG Integration

27. HyDE + Vector Search
28. HyDE + Hybrid Search
29. HyDE + Reranking
30. HyDE + Multi-Query Retrieval
31. Fallback to original query
32. Complete HyDE RAG Architecture

---

## Top 5 Interview Questions

প্রশ্নগুলো একবারে একটি করে আলোচনা হবে। ব্যবহারকারী `next` বললে পরের unanswered প্রশ্ন দেওয়া হবে।

1. What is HyDE and how does it work in RAG?
2. Why does HyDE generate a hypothetical document instead of directly embedding the user query?
3. What is the difference between Traditional Vector Retrieval, Query Expansion, Multi-Query Retrieval, and HyDE?
4. What are the benefits and limitations of HyDE?
5. How would you integrate HyDE with Hybrid Search and Reranking in a production RAG pipeline?

উত্তরের ধরন: সংক্ষিপ্ত বাংলা ব্যাখ্যা, ছোট technical example, interview-ready answer, এবং প্রাসঙ্গিক হলে Interview Trap।

---

## Coding Part

Concepts এবং Top 5 interview Q&A সম্পূর্ণ হওয়ার পরে, user coding শুরু করতে বললে implementation হবে। Existing retrieval, hybrid fusion, reranker, এবং RAG generation reuse করতে হবে; সেগুলো rebuild করা যাবে না।

### Target Architecture

```text
User Query
    ↓
HyDE Service
    ↓
LLM generates Hypothetical Document
    ↓
Generate Embedding
    ↓
Vector / Hybrid Retrieval
    ↓
Candidate Results
    ↓
Existing Reranker
    ↓
Final Top-K
    ↓
Context Construction
    ↓
LLM Answer Generation
```

### Implementation Requirements

1. Create `HyDEService`.
2. Generate hypothetical documents using the existing local LLM.
3. Embed the hypothetical document.
4. Reuse existing vector retrieval.
5. Support hybrid search integration.
6. Reuse the existing reranker.
7. Preserve the original user query for final answer generation and reranking.
8. Make HyDE configurable on/off.
9. Handle empty hypothetical documents.
10. Handle LLM timeout and failure.
11. Fall back to retrieval using the original query/embedding.
12. Add useful logging and error handling without logging sensitive content.

### Testing Requirements

- Normal query
- Short query
- Ambiguous query
- Empty hypothetical document
- LLM generation failure
- LLM timeout
- Embedding failure
- No retrieval results
- Reranker failure
- HyDE enabled versus disabled comparison

### Evaluation

Compare:

| Approach | Evaluate |
|---|---|
| Traditional Retrieval | Baseline recall and relevance |
| Multi-Query Retrieval | Recall and latency |
| HyDE Retrieval | Recall, relevance, retrieval noise, and latency |

HyDE যে সব query-তে retrieval improve করবে এমন দাবি করা যাবে না; observed results লিখতে হবে।

---

## Out of Scope

- Agentic RAG
- Knowledge Graph RAG
- Fine-tuning
- ColBERT
- Late Interaction
- Advanced Query Routing
- Paid APIs
- Large GPU-only models

---

## Today's Workflow

```text
Concept Reading
      ↓
Top 5 Interview Q&A (one by one, user says `next`)
      ↓
User explicitly starts coding
      ↓
Implementation and tests
      ↓
Evaluation
      ↓
Week 3 Day 5 Complete
```

**Important:** Concepts, Top 5 Q&A, coding, testing, এবং evaluation সম্পূর্ণ না হওয়া পর্যন্ত Day 5 complete mark করা হবে না।
