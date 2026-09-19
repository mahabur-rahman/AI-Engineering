# Week 2 - Day 7

## RAG Evaluation + Quality Testing

আজকের লক্ষ্য হলো RAG system শুধু "API কাজ করছে" কি না তা না দেখে, উত্তরগুলো আসলেই relevant, grounded, এবং reliable কি না তা evaluate করা।

---

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Stack: Node.js, NestJS, TypeScript, PostgreSQL, pgvector, Prisma, Ollama
- Embedding model: local `nomic-embed-text`
- Generation model: local Ollama model configured in `.env.local`
- Previous milestone: Week 2 Day 6 end-to-end RAG pipeline integration completed
- Project: AI Business Copilot

---

## Day 7 working rules

- আজকের scope শুধু basic RAG evaluation-এ সীমিত থাকবে
- Advanced evaluation framework বা research-level metrics আজ প্রয়োজন না হলে করা হবে না
- Reranking, hybrid search, query expansion, multi-query, HyDE, agentic RAG, fine-tuning, advanced observability, এবং production scaling আজকের scope-এর বাইরে
- Concepts এবং TOP 5 প্রশ্ন শেষ না হওয়া পর্যন্ত coding শুরু হবে না
- Day 6-এর working RAG pipeline rebuild করা হবে না; existing `/ask` API এবং services reuse করা হবে
- Coding step-by-step হবে: প্রতিটি ধাপে কী এবং কেন explain করা হবে, শুধু প্রয়োজনীয় code দেখানো হবে, তারপর implement ও test করার পর review হয়ে পরের ধাপে যাওয়া হবে
- User `next` বললে TOP 5-এর পরের unanswered question দেওয়া হবে

---

# PART 1 - MUST-READ CONCEPTS

1. RAG Evaluation কেন প্রয়োজন
2. Functional Testing বনাম RAG Quality Evaluation
3. একটি ভালো RAG answer-এর বৈশিষ্ট্য কী
4. Answer Relevance
5. Context Relevance
6. Context Sufficiency
7. Groundedness / Faithfulness
8. Retrieval Quality
9. Precision in Retrieval
10. Recall in Retrieval
11. Top-K evaluation
12. Retrieved chunk quality
13. Answer correctness
14. Groundedness বনাম Correctness
15. Hallucination testing
16. No-context / insufficient-context testing
17. Golden Dataset
18. Evaluation Dataset
19. Expected Answer বনাম Generated Answer
20. LLM-as-a-Judge
21. Deterministic evaluation
22. Basic RAG evaluation metrics
23. Manual evaluation
24. RAG-এর জন্য regression testing
25. কেন prompt/chunking/retrieval পরিবর্তন RAG quality-কে প্রভাবিত করে

---

# PART 2 - TOP 5 MUST-READ QUESTIONS

1. Groundedness এবং Correctness-এর মধ্যে পার্থক্য কী, এবং এটা RAG system-এর জন্য কেন গুরুত্বপূর্ণ?
2. Retrieval precision এবং recall কী, এবং Top-K নির্বাচন করার সময় এই দুটোর মধ্যে trade-off কীভাবে কাজ করে?
3. Golden/Evaluation dataset কী, এবং exact string match দিয়ে generated answer-কে expected answer-এর সাথে তুলনা করা কেন যথেষ্ট নয়?
4. Hallucination এবং no-context/insufficient-context scenario কীভাবে test এবং detect করা হয়?
5. RAG-এর জন্য regression testing কেন দরকার, এবং prompt/chunking/retrieval পরিবর্তনের পর কী verify করতে হয়?

প্রতিটি প্রশ্নের উত্তর হবে:

- বাংলা
- সংক্ষিপ্ত
- ইন্টারভিউ-focused
- ছোট technical example সহ
- প্রয়োজনে Interview Trap সহ

User explicitly না চাইলে ৫টার বেশি প্রশ্ন দেওয়া হবে না।

---

# PART 3 - CODING / PRACTICAL WORK

Concepts এবং TOP 5 প্রশ্ন শেষ হওয়ার পরেই coding শুরু হবে।

Existing stack:

- NestJS
- TypeScript
- PostgreSQL
- pgvector
- Local embedding model
- Ollama/local LLM
- REST API

Day 6-এর working RAG pipeline (`/ask` endpoint, `RagService`, `context-builder`) rebuild করা হবে না। আজকের কোডিং শুধু existing RAG system-কে **test এবং evaluate** করার জন্য।

---

# PART 4 - DAY 7 CODING CHECKLIST

Basic RAG evaluation setup implement করতে হবে:

1. একটি ছোট evaluation dataset তৈরি করা
2. Questions store করা
3. Expected/reference answers store করা
4. যেখানে practical, expected relevant information/source store করা
5. প্রতিটি question RAG API-এর মাধ্যমে চালানো
6. Retrieved chunks capture করা
7. Generated answer capture করা
8. Generated answer-কে expected/reference answer-এর সাথে compare করা
9. Answer retrieved context-এ grounded কি না চেক করা
10. Answer relevance test করা
11. Retrieval relevance test করা
12. Insufficient/no-context প্রশ্ন test করা
13. Hallucinated answer identify করা
14. Evaluation result record করা
15. একটি সহজ evaluation summary তৈরি করা

## Example dataset

```json
[
  {
    "question": "What is our refund policy?",
    "expectedAnswer": "Customers can request a refund within 30 days.",
    "expectedSource": "refund-policy"
  }
]
```

## Example evaluation result

```json
{
  "question": "...",
  "answer": "...",
  "retrievedChunks": 3,
  "relevantContext": true,
  "grounded": true,
  "answerRelevant": true,
  "hallucination": false
}
```

---

# PART 5 - TEST CASES

কমপক্ষে এই কেসগুলো test করতে হবে:

1. স্পষ্টভাবে উত্তর পাওয়া যায় এমন প্রশ্ন
2. একাধিক chunk প্রয়োজন হয় এমন প্রশ্ন
3. Irrelevant retrieval হয় এমন প্রশ্ন
4. তথ্য missing এমন প্রশ্ন
5. Hallucination trigger করার জন্য ডিজাইন করা প্রশ্ন
6. Ambiguous wording-এর প্রশ্ন
7. একটি নির্দিষ্ট source থেকে উত্তর আসা উচিত এমন প্রশ্ন

---

# PART 6 - CODING APPROACH

পুরো evaluation implementation একবারে দেওয়া হবে না।

প্রতিটি coding step-এ এই sequence অনুসরণ করা হবে:

1. কী build করা হচ্ছে তা explain করা
2. কেন এটা গুরুত্বপূর্ণ তা explain করা
3. শুধু প্রয়োজনীয় code দেখানো
4. ব্যবহারকারী নিজে implement করবে
5. ব্যবহারকারীকে test করতে বলা হবে
6. Result review করা হবে
7. তারপর পরের step-এ যাওয়া হবে

Existing Day 6 RAG API এবং services reuse করা হবে। প্রয়োজন না হলে working code rewrite করা হবে না।

---

# PART 7 - DAY 7 SUCCESS CRITERIA

Day 7 শেষে বুঝতে হবে:

- RAG system কীভাবে evaluate করতে হয়
- Correctness এবং groundedness-এর মধ্যে পার্থক্য
- Retrieval quality কীভাবে evaluate করতে হয়
- Generated answer কীভাবে evaluate করতে হয়
- Hallucination কীভাবে detect করতে হয়
- Golden/evaluation dataset কী
- RAG-এর জন্য regression testing কেন দরকার

এবং একটি basic evaluation workflow থাকতে হবে:

```text
Evaluation Dataset
    -> RAG API
    -> Retrieval Results
    -> Generated Answer
    -> Quality Checks
    -> Evaluation Result
    -> Summary
```

---

## Important

Day 7-এর concepts, TOP 5 প্রশ্ন, এবং practical evaluation work সম্পূর্ণ না হওয়া পর্যন্ত Week 3-তে move করা হবে না।
