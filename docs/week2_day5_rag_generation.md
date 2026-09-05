# Week 2 - Day 5

## RAG Generation + Context Construction

আজকের লক্ষ্য হলো retrieved chunks-কে clean, relevant context-এ রূপান্তর করে local LLM-এর মাধ্যমে grounded answer তৈরি করা।

আজকের scope:

```text
User Question
    -> Query Validation
    -> Existing Vector Retrieval
    -> Relevant Chunks
    -> Deduplication and Context Construction
    -> RAG Prompt
    -> Local Ollama LLM
    -> Grounded Answer and Sources
```

আজকের মধ্যে advanced RAG topics করা হবে না:

- reranking
- hybrid search
- query expansion
- multi-query retrieval
- HyDE
- agentic retrieval
- fine-tuning
- advanced evaluation

---

# MUST-LEARN CONCEPTS

1. What is RAG Generation?
2. Retrieval -> Context -> Prompt -> LLM -> Answer flow
3. What is retrieved context?
4. Context vs Prompt
5. What is a grounded answer?
6. Why grounding is important
7. How multiple retrieved chunks are combined into context
8. Why chunk order and relevance matter
9. Why every Top-K chunk should not always be sent to the LLM
10. Irrelevant and duplicate chunks
11. Context size control
12. Context window
13. Token budget
14. System instruction vs retrieved context
15. Where retrieved context should be placed in the prompt
16. Context delimiters
17. How to instruct the LLM to answer only from provided context
18. What to do when the answer is not present in context
19. Why hallucination can still happen in RAG
20. Groundedness and faithfulness
21. What to do when retrieval returns no useful context
22. Why more context is not always better

For every concept, study:

- short Bangla explanation
- simple technical example
- important interview trap when relevant

---

# TOP 5 INTERVIEW QUESTIONS

These questions will be studied one by one. The next question is given only when the learner says `next`.

1. Retrieved context, prompt, এবং grounded answer-এর মধ্যে পার্থক্য কী?
2. কেন Top-K-এর সব chunk সরাসরি LLM-কে পাঠানো উচিত নয়?
3. RAG system-এ context window এবং token budget কীভাবে manage করবে?
4. Retrieved context-এ answer না থাকলে LLM-কে কীভাবে উত্তর দিতে instruct করবে?
5. RAG থাকা সত্ত্বেও hallucination কেন হতে পারে এবং groundedness কীভাবে improve করবে?

---

# CODING IMPLEMENTATION

Concept এবং Top 5 questions শেষ হওয়ার পরে ধাপে ধাপে implement করা হবে:

1. Create or complete a RAG service
2. Connect the existing Day 4 retrieval service
3. Receive a user question through a REST API
4. Generate the query embedding through existing retrieval logic
5. Retrieve relevant tenant-scoped chunks
6. Preserve retrieval relevance order
7. Remove duplicate chunks
8. Build a clean bounded context
9. Control context size
10. Build a structured RAG prompt
11. Add clear context delimiters
12. Require answers to use only supplied context
13. Reject unsupported invention
14. Handle insufficient and empty context
15. Call local Ollama
16. Return a grounded answer
17. Return source and chunk metadata
18. Handle LLM timeout and failure
19. Test a question answerable from stored documents
20. Test a question absent from stored documents
21. Verify unsupported questions do not receive confident invented answers

Expected API flow:

```text
POST /ask
    -> Validate question and tenant
    -> Retrieve relevant chunks
    -> Deduplicate and filter context
    -> Construct bounded context
    -> Build grounded prompt
    -> Call Ollama
    -> Return answer and sources
```

---

# CODING WORKFLOW

Each coding step must follow this sequence:

1. Explain what is being built
2. Explain why it is needed
3. Show only the necessary code
4. Let the learner implement it
5. Ask the learner to test it
6. Review the code or output
7. Move to the next step only after verification

No complete project dump is allowed. Day 6 will not begin until the concepts, Top 5 questions, and coding implementation are complete.

---

# DAY 5 SUCCESS CRITERIA

By the end of Day 5, the learner can explain and implement:

```text
User Query
    -> Retrieval
    -> Relevant Chunks
    -> Context Construction
    -> RAG Prompt
    -> LLM
    -> Grounded Answer
    -> Sources
```

The learner understands:

- how RAG generates an answer
- how context is constructed
- why context quality matters
- context window and token limitations
- why hallucination can still happen
- how to handle insufficient context
- how to build a basic production-oriented RAG generation service