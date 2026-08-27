8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

PERSONAL LEARNING ROADMAP · 26 WEEKS 

**AI Engineering — ৬**   
**মাসের সম্পূর্ণ R**   
**র্ণoadmap** 

লক্ষ্য: Full-Stack / Senior Software Engineer — 

Worldwide Remote Job (Bangladesh থেকে) 

শুরু \~2026-08-18 দিনে 1–1.5 ঘণ্টা বাজেট $0 8GB RAM · Ubuntu 

একটাই flagship project 

01 **Goal & Success Criteria** 

**মূল ট্র্যাক** Full-Stack Software Engineer / Senior Software Engineer (Remote, Worldwide) 

AI   
ENGINEERINGDifferentiator skill — হাজার হাজার একই-রকম resume এর ভিড়ে আলাদা করে দেখানোর জন্য 

**গভীরতা** Basic → Master — যেকোনো interview প্রশ্নের উত্তর confidently দেওয়ার মতো DELIVERABLE একটাই flagship project, যেখানে শেখা প্রতিটা জিনিস apply হবে 

**সময়** ৬ মাস (২৬ সপ্তাহ), দিনে ১–১.৫ ঘণ্টা 

**৬ মাস পরে Success দেখতে যেমন হবে:** একটা সম্পূর্ণ প্রো র্ণ ডাকশন-গ্রেড AI 

powered SaaS প্রজেক্ট GitHub এ live থাকবে ও resume এ bullet point হিসেবে 

থাকবে; যেকোনো AI Engineering প্রশ্নের গভীর উত্তর (concept \+ code \+ trade 

off) দিতে পারবে; System Design \+ Full-Stack \+ AI Engineering — তিনটার 

উপরেই confident থাকবে। 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 1/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 02 **Constraints — সবসময় মাথায় রাখতে হবে** 

বাজেট 

$0 — কোনো paid API/service ব্যবহার করা যাবে না 

DEPLOYMENT 

প্রথমে সম্পূর্ণ locally, hosting র্ণ পরে (free tier দিয়ে)   
হার্ডওয়্যার 

Ubuntu, ৮GB RAM — শুধুছোট quantized মডেল (≤3–4B params) 

LEARNING STYLE 

Deep learner — শর্টকাট না, ভিতর থেকে বোঝা 

**ফ্রি / লোকাল টুলস্ট্যাক (পুরো ৬ মাস এটাই ব্যবহার হবে) প্রয়োজন টুল কেন ফ্রি**   
**LLM** Ollama \+ Llama 3.2 3B / Phi-3 mini / Qwen 2.5 3B   
লোকালি চলে, API key লাগে না 

**Vector DB** pgvector Docker এ self-hosted, PostgreSQL already জানা 

**Embeddings** nomic-embed-text \~250MB, হালকা **Backend** NestJS \+ GraphQL \+ Prisma existing stack **Frontend** Next.js existing stack **Queue** RabbitMQ existing অভিজ্ঞতা **Cache** Redis existing অভিজ্ঞতা 

**Observability** Pino/Winston \+ OpenTelemetry \+ Prometheus/Grafana   
সব ফ্রি, self-hosted 

**Container** Docker \+ Compose ফ্রি 

**Vision** Ollama LLaVA / Llama 3.2-vision (ছোট variant)   
লোকাল, ফ্রি 

**Fine-tuning** Unsloth / LoRA ফ্রি, ওপেন সোর্স, CPU-friendly র্স **Backup plan** Groq API / Gemini free tier কার্ড ছাড়াই ফ্রি tier 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 2/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 03 **Flagship Project — "AI Business Copilot"** 

তোমার existing **Invoice Management System** (multi-tenant, RBAC) কে ভিত্তি ধরে, তার উপর একটা autonomous multi-agent AI টিম বসানো হবে — যারা শুধুপ্রশ্নের উত্তর দেয় না, বাস্তব সিদ্ধান্ত নেয় ও action নেয়। 

**Agent টিম** 

**Supervisor Agent** 

বাকি agent দের কোঅর্ডিনের্ডি ট করে, কাজ ভাগ করে দেয় 

**Support Agent** 

Customer কে reply draft করে (fine-tuned brand voice এ) 

**কেন এটাই সেরা choice**   
**Sales Analyst Agent** 

Revenue trend, business insight বলে (RAG দিয়ে) 

**Fraud Detector Agent** 

সন্দেহজনক order/invoice flag করে 

1   
তোমার existing project \+ real job experience (Order Management, Invoicing) এর সাথে সরাসরি জোড়া — authentic গল্প 

2 Business-facing — যেকোনো company এর hiring manager বুঝবে, শুধু infra/SRE টিম না 3 AI Engineering এর প্রায় সব টপিক এক প্রজেক্টে ঢুকে যায় 

4 $0 বাজেট ও ৮GB RAM এ সম্পূর্ণ সম্ভব র্ণ — demonstration-scale, massive production load না **AI Engineering Topic Coverage Matrix** 

**টপিক এই প্রজেক্টে কোথায়** 

LLM API \+ Prompt Engineering Chat interface — ব্যবসা সম্পর্কে প্রশ্ন করা 

Embeddings \+ Vector Search Order/customer/invoice ডেটার semantic search RAG ব্যবসা insight প্রশ্নের উত্তর data থেকে 

Tool/Function Calling Reminder পাঠানো, invoice status বদলানো 

AI Agents (ReAct) প্রতিটা specialist agent 

Multi-agent Orchestration Supervisor \+ ৩টা specialist agent 

Multimodal (Vision) Receipt/invoice ছবি পড়া (OCR \+ vision) 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 3/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

Fine-tuning (LoRA) Support Agent এর reply brand-voice এ কাস্টমাইজ Evaluation \+ Guardrails বড় action এর আগে human confirmation 

AI Observability প্রতিটা AI decision এর cost/latency/accuracy ট্র্যাক Semantic Caching বারবার একই প্রশ্নের উত্তর দ্রুত দেওয়া 

Local Model Deployment পুরো প্রজেক্ট জুড়েজু Ollama ব্যবহার 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 4/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

PHASE 1 · WEEK 1–6 

**Foundation — "AI Engineering Core"** 

লক্ষ্য: AI Engineering এর প্রতিটা মূল building block হাতে-কলমে শেখা, আর সাথে সাথে flagship project এর ভিত্তি বানানো। এই ফেজ শেষে হাতে একটা কাজ-করা 

প্রথম ভার্সনর্স থাকবে — তখন থেকেই job apply করা যাবে। 

WEEK 1 **LLM Fundamentals \+ Prompt Engineering** 

**কেন:** AI Engineering এর সব কিছুর ভিত্তি হলো LLM এর সাথে reliably কথা বলতে পারা। এটা না জানলে RAG, Agent — কিছুই দাঁড়া দাঁ বে না। 

**কোথা থেকে:** ollama.com/docs, promptingguide.ai, Anthropic/OpenAI prompt engineering guide **দিন টপিক কী করবে** 

Sat Setup Ollama, Docker install; Llama 3.2 3B \+ Phi-3 mini pull; প্রথম CLI চ্যাট; token/context window বোঝা 

Sun API Basics NestJS থেকে Ollama এর local HTTP API কল করা — প্রথম script 

Mon Prompt Patterns 

Tue Structured Output   
Zero-shot, few-shot, system prompt, role prompting — প্রতিটা try করা JSON mode এ force করে output নেওয়া, reliably parse করা code এ 

Wed Streaming Token-by-token streaming — console ও একটা simple HTTP endpoint এ 

Thu CoT \+ Parameters   
Chain-of-thought prompting; temperature/top\_p/top\_k পরিবর্তনর্ত করে observe করা 

Fri Review "LLM API call end-to-end কীভাবে কাজ করে?" — নিজে ব্যাখ্যা লিখে রাখা file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 5/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap WEEK 2 **Embeddings \+ Vector Databases** 

**কেন:** এটা কীভাবে AI "অর্থ" র্থদিয়ে সার্চ করে (keyword না) — RAG এর ভিত্তি। 

**কোথা থেকে:** pgvector GitHub README, Ollama embedding models docs 

**দিন টপিক কী করবে** 

Sat Theory Embedding কী, vector space, cosine similarity — ছোট example হাতে ক্যালকুলেট 

Sun pgvector Setup Docker এ Postgres+pgvector; embedding column; \<-\>, \<=\> অপারেটর 

Mon Generate Embeddings   
nomic-embed-text দিয়ে embedding বানিয়ে pgvector এ store 

Tue Semantic Search Query দিলে top-K nearest embedding বের করার script 

Wed Keyword vs Semantic   
SQL LIKE বনাম vector search — পার্থক্য র্থ নোট করা 

Thu Chunking Strategy Fixed-size vs sentence-based vs recursive — ২টা implement Fri Review Vector search non-technical \+ senior engineer দুই ভার্সনের্স ব্যাখ্যা লেখা 

WEEK 3 **RAG Pipeline: Retrieval** 

**কেন:** RAG দিয়ে AI তোমার নিজের ডেটা ব্যবহার করে উত্তর দিতে পারে — enterprise AI Engineering এর কেন্দ্রীয় স্কিল। 

**কোথা থেকে:** "RAG from Scratch" (framework ছাড়া প্রথমে নিজে বানানো), pgvector docs 

**দিন টপিক কী করবে** 

Sat Architecture Ingestion pipeline vs query pipeline — diagram আঁকা আঁ 

Sun Ingestion Sample business docs/invoice লোড, chunk, embed, store 

Mon Retrieval Query embed করে vector search দিয়ে top-K chunk বের করা Tue Re-ranking Basics কেন raw vector search যথেষ্ট না — simple heuristic 

Wed Hybrid Search Keyword (Postgres full-text) \+ vector search combine 

Thu Edge Cases Relevant result না পেলে, খুব লম্বা document, duplicate content Fri Review "কোম্পানির internal docs এর জন্য RAG ডিজাইন" — উত্তর তৈরি 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 6/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap WEEK 4 **RAG Pipeline: Generation \+ Integration** 

**কেন:** শুধু retrieve করলেই হবে না — সঠিকভাবে context দিয়ে hallucination ছাড়া answer generate করানো শিখতে হবে। 

**কোথা থেকে:** promptingguide.ai RAG section, context-injection best practices 

**দিন টপিক কী করবে** 

Sat Context Injection Retrieved chunk গুলো prompt এ কীভাবে format করবে Sun Grounding \+ Citation কোন chunk থেকে answer এসেছে বলা — hallucination কমায় Mon "I Don't Know" তথ্য না থাকলে বানিয়ে না বলার prompt pattern 

Tue Build RAG Endpoint NestJS/GraphQL এ পুরো endpoint (question → grounded answer) Wed Real Data Integration নিজের Invoice/Order data দিয়ে সংযুক্ত — flagship project শুরু Thu Testing ১০+ real প্রশ্ন দিয়ে টেস্ট, ব্যর্থতা র্থ নোট 

Fri Review "RAG end-to-end \+ hallucinate করলে কীভাবে debug করবে?" 

WEEK 5 **Tool-Calling \+ AI Agents** 

**কেন:** এখানেই AI "উত্তর দেওয়া" থেকে "action নেওয়া"-তে পরিণত হয় — সবচেয়ে valuable ও কঠিন স্কিল। **কোথা থেকে:** Ollama function-calling docs, "ReAct" paper (arxiv.org) 

**দিন টপিক কী করবে** 

Sat Tool-Calling Theory   
LLM কীভাবে function call সিদ্ধান্ত নেয়, JSON schema 

Sun প্রথম Tool "getInvoiceStatus" ফাংশন বানিয়ে আসল GraphQL resolver এর সাথে যুক্ত 

Mon ReAct Pattern Think → Act → Observe loop বানানো 

Tue Multi-step Agent ২-৩টা tool call chain (overdue invoice খুঁজেখুঁ reminder draft) 

Wed Safety Guardrails ঝুঁকিপূর্ণ action র্ণ এর আগে confirm-before-action pattern 

Thu Error Handling Tool call fail, ভুল argument, infinite loop প্রতিরোধ 

Fri Review "Agent কীভাবে কাজ করে, destructive action কীভাবে আটকাবে?" file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 7/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 6 · �� **Project Integration \+ Foundation Milestone** 

**কেন:** এতদিনের সব কিছু একটা কাজ-করা slice এ একত্রিত করা — এখান থেকেই job apply শুরু করা যাবে। 

**দিন টপিক কী করবে** 

Sat Architecture Review Clean layering ঠিক করা (domain/application/infra/presentation) Sun Unit Tests RAG \+ agent logic এর unit test 

Mon Integration Tests GraphQL এ e2e টেস্ট 

Tue Chat UI Next.js এ simple কাজ-করা চ্যাট ইন্টারফেস 

Wed Docker Compose পুরো স্ট্যাক এক কমান্ডে চালানো 

Thu Documentation README, architecture decision লেখা 

Fri �� Milestone ৫ মিনিটের self-demo রেকর্ড; resume/GitHub র্ড আপডেট 

✅ **Phase 1 শেষে:** একটা কাজ-করা, resume-এ দেখানোর মতো project রেডি 

— এখন থেকে apply শুরু করা যায়। 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 8/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

PHASE 2 · WEEK 7–18 

**Depth — "Advanced AI Engineering"** 

লক্ষ্য: Foundation কে production-grade এ উন্নীত করা — multi-agent, 

multimodal, fine-tuning, evaluation। এটা job search এর সাথে parallel এ চলবে। 

WEEK 7–8 **Advanced RAG** 

**কেন:** Basic RAG থেকে production-quality RAG এ যাওয়া — কোয়ালিটি measure ও উন্নত করতে জানা। **কোথা থেকে:** RAGAS framework docs, Postgres full-text search docs 

**দিন টপিক** 

W7 Sat Semantic chunking (অর্থ অর্থ নুযায়ী ভাগ করা) 

W7 Sun Re-ranking মডেল (cross-encoder concept) 

W7 Mon Hybrid search tuning — keyword ও vector এর weight ব্যালেন্স 

W7 Tue Multi-document reasoning 

W7 Wed Retrieval precision/recall measure 

W7 Thu নিজের project এ apply 

W7 Fri Review \+ interview practice 

W8 Sat RAG evaluation dataset বানানো 

W8 Sun Automated evaluation script 

W8 Mon Failure case ক্যাটাগরাইজ করা 

W8 Tue Retrieval improve করা 

W8 Wed Benchmark — আগে-পরে তুলনা 

W8 Thu Documentation \+ integrate 

W8 Fri Review: "RAG এর quality কীভাবে measure করবে?" 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratchp… 9/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 9–10 **Evaluation & Guardrails** 

**কেন:** Production AI তে "কাজ করে" যথেষ্ট না, "ভরসাযোগ্য" হতে হবে — hallucination ধরা ও আটকানো শেখা। 

**কোথা থেকে:** "LLM-as-judge" pattern, OWASP LLM Top 10 

**দিন টপিক** 

W9 Sat LLM-as-judge pattern 

W9 Sun Hallucination detection technique 

W9 Mon নিজের project এর জন্য eval dataset 

W9 Tue Automated regression test (AI output) 

W9 Wed Content safety filtering 

W9 Thu PII redaction 

W9 Fri Review \+ interview practice 

W10 Sat Guardrail framework ডিজাইন 

W10 Sun Prompt injection ও প্রতিরোধ 

W10 Mon Rate limiting AI calls (cost control) 

W10 Tue Guardrail project এ apply 

W10 Wed Adversarial input দিয়ে টেস্ট 

W10 Thu Documentation 

W10 Fri Review: "AI ভুল কাজ করবে না কীভাবে নিশ্চিত করবে?" 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 10/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 11–13 **Multi-Agent Orchestration** 

**কেন:** এটাই flagship project এর সবচেয়ে impressive অংশ — একাধিক specialized AI একসাথে কাজ করা। 

**কোথা থেকে:** Multi-agent supervisor pattern, নিজে ডিজাইন (framework ছাড়া প্রথমে) 

**দিন টপিক** 

W11 Sat Multi-agent theory — supervisor pattern, agent-to-agent communication 

W11 Sun Supervisor Agent বানানো 

W11 Mon Sales Analyst Agent বানানো 

W11 Tue Sales Analyst কে RAG এর সাথে যুক্ত 

W11 Wed টেস্ট \+ debug 

W11 Thu Integration project এ 

W11 Fri Review \+ interview practice 

W12 Sat Support Agent বানানো 

W12 Sun Fraud Detector Agent বানানো 

W12 Mon Fraud detection logic (pattern \+ AI reasoning) 

W12 Tue Agent দের মধ্যে conflict resolution 

W12 Wed Supervisor দিয়ে সব agent কোঅর্ডিনের্ডি ট 

W12 Thu Integration \+ টেস্ট 

W12 Fri Review \+ interview practice 

W13 Sat Agent failure handling 

W13 Sun Agent এর জন্য logging/tracing 

W13 Mon Performance optimization (parallel agent execution) 

W13 Tue End-to-end টেস্ট (পুরো multi-agent flow) 

W13 Wed Edge case handling 

W13 Thu Documentation 

W13 Fri �� Milestone: সম্পূর্ণ multi-agent র্ণ সিস্টেমের ডেমো রেকর্ড 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 11/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 14–15 **Multimodal AI (Vision)** 

**কেন:** Text ছাড়াও ছবি বোঝা — receipt/invoice আপলোড ফিচারের জন্য দরকার, AI Engineering এর বড় অংশ। 

**কোথা থেকে:** Ollama vision model docs (LLaVA, Llama 3.2-vision ছোট variant) 

**দিন টপিক** 

W14 Sat Vision model theory — image কীভাবে encode হয়ে LLM এ যায় 

W14 Sun Ollama তে vision model সেটআপ (৮GB RAM এর জন্য ছোট variant) 

W14 Mon প্রথম image-understanding script 

W14 Tue OCR concept — receipt থেকে টেক্সট বের করা 

W14 Wed Structured data extraction (amount, date, vendor) 

W14 Thu Test real receipt/invoice images দিয়ে 

W14 Fri Review \+ interview practice 

W15 Sat Feature integration — upload endpoint 

W15 Sun Fraud Detector agent এর সাথে multimodal যুক্ত 

W15 Mon Error handling (অস্পষ্ট ছবি, ভুল ফরম্যাট) 

W15 Tue Performance (RAM এর মধ্যে থেকে) 

W15 Wed Test \+ polish 

W15 Thu Documentation 

W15 Fri Review: "Multimodal AI কীভাবে কাজ করে?" 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 12/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 16–17 **Fine-tuning Basics (LoRA)** 

**কেন:** নিজের ডেটা দিয়ে মডেল কাস্টমাইজ করা জানলে "শুধু API user" না, "মডেল বোঝা ইঞ্জিনিয়ার" হিসেবে দেখাবে। 

**কোথা থেকে:** Unsloth ডকুমেন্টেশন (ফ্রি, CPU-friendly LoRA fine-tuning) 

**দিন টপিক** 

W16 Sat Fine-tuning vs prompt engineering vs RAG — কখন কোনটা 

W16 Sun LoRA concept — ছোট adapter ট্রেন করা 

W16 Mon Training dataset বানানো (Support Agent reply স্টাইল) 

W16 Tue Unsloth সেটআপ, প্রথম LoRA ট্রেনিং রান 

W16 Wed ট্রেনিং মনিটর, loss বোঝা 

W16 Thu Fine-tuned মডেল টেস্ট 

W16 Fri Review \+ interview practice 

W17 Sat Before/after তুলনা 

W17 Sun Fine-tuned মডেল project এ integrate 

W17 Mon Overfitting চেক, dataset quality 

W17 Tue Model versioning strategy 

W17 Wed Documentation 

W17 Thu Test edge cases 

W17 Fri Review: "কখন fine-tune, কখন RAG যথেষ্ট?" 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 13/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 18 · �� **AI Observability \+ Cost/Performance Optimization** 

**কেন:** Production এ AI চালাতে cost, latency, accuracy ট্র্যাক করা জানতে হবে — junior ও senior AI engineer এর পার্থক্য র্থ এটাই। 

**কোথা থেকে:** OpenTelemetry docs, Prometheus/Grafana docs 

**দিন টপিক** 

Sat Token usage ট্র্যাকিং 

Sun Semantic caching 

Mon Latency optimization (parallel calls, streaming) 

Tue Cost-per-request ড্যাশবোর্ড 

Wed AI-specific tracing (prompt/model version) 

Thu পুরো observability layer এর সাথে integrate 

Fri �� Phase 2 Milestone: সম্পূর্ণ advanced project র্ণ ডেমো, resume আপডেট 

✅ **Phase 2 শেষে:** Production-grade, multi-agent, multimodal, fine-tuned 

AI system — সম্পূর্ণ observability র্ণ সহ। 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 14/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

PHASE 3 · WEEK 19–24 

**Production Hardening \+ Interview Mastery** 

লক্ষ্য: বাকি full-stack gap (observability) বন্ধ করা, System Design এর সাথে AI 

Engineering যুক্ত করা, এবং interview-ready হওয়া। 

WEEK 19–20 **Full-Stack Production Hardening** 

**কেন:** তোমার নিজের proxy\_api প্রজেক্টেও এখনো এই gap আছে — শেখাটা real কাজেও লাগবে। **কোথা থেকে:** NestJS logging docs, OpenTelemetry NestJS integration guide 

**দিন টপিক** 

W19 Sat Structured logging (Pino/Winston) \+ correlation ID 

W19 Sun Request ID প্রতিটা log এ যুক্ত 

W19 Mon OpenTelemetry tracing সেটআপ 

W19 Tue Distributed tracing (request পুরো সিস্টেম দিয়ে যাওয়া দেখা) 

W19 Wed Prometheus metrics এক্সপোজ 

W19 Thu Grafana dashboard বানানো 

W19 Fri Review \+ interview practice 

W20 Sat Slow query detection 

W20 Sun Error monitoring (Sentry self-hosted/free tier) 

W20 Mon Health check endpoint 

W20 Tue Memory/CPU monitoring 

W20 Wed পুরো observability stack টেস্ট 

W20 Thu Documentation 

W20 Fri Review: "৩টার সময় প্রোডাকশন ইস্যু হলে কীভাবে debug করবে?" 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 15/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 21–22 **Advanced System Design (AI-Systems-Specific)** 

**কেন:** System design roadmap এর সাথে AI Engineering যুক্ত করা — interviewer রা এখন প্রায়ই "AI system design" জিজ্ঞেস করে। 

**কোথা থেকে:** নিজের system-design ৯-ধাপ framework পুনরায় ব্যবহার 

**দিন টপিক** 

W21 Sat Design: "millions of documents এর জন্য RAG সিস্টেম" 

W21 Sun Design: "Multi-tenant AI SaaS" 

W21 Mon Design: "Real-time AI agent platform" 

W21 Tue Trade-off practice: latency vs accuracy vs cost 

W21 Wed Mock interview (নিজে বলে রেকর্ড)র্ড 

W21 Thu দুর্বলর্ব জায়গা ঠিক করা 

W21 Fri Review 

W22 Sat Design: "Fraud detection at scale" 

W22 Sun Design: "Customer support AI at scale" 

W22 Mon Failure scenario প্রশ্ন প্র্যাকটিস 

W22 Tue Scaling প্রশ্ন প্র্যাকটিস 

W22 Wed Mock interview \#2 

W22 Thu Feedback অনুযায়ী উন্নতি 

W22 Fri Review 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 16/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

WEEK 23 **Technical Interview Question Bank Sprint** 

**কেন:** সব category জুড়েজু চূড়ান্ত প্রস্তুতি — শুধু AI না, পুরো full-stack \+ AI combined। 

**দিন ফোকাস** 

Sat NestJS \+ GraphQL প্রশ্ন রিভিউ 

Sun Node.js \+ Database প্রশ্ন রিভিউ 

Mon System Design প্রশ্ন রিভিউ 

Tue AI/RAG/Agent সংক্রান্ত প্রশ্ন প্র্যাকটিস 

Wed Behavioral/HR (remote-specific) প্রশ্ন প্র্যাকটিস 

Thu দুর্বলর্ব জায়গা খুঁজেখুঁ টার্গেটর্গে রিভিউ 

Fri পূর্ণ mock interview র্ণ 

WEEK 24 · �� **Mock Interviews \+ Final Polish** 

**দিন টপিক** 

Sat পুরো project end-to-end ব্যাখ্যা প্র্যাকটিস (৫ ও ১৫ মিনিট ভার্সনর্স) 

Sun Mock interview \#3 (রেকর্ড করে নিজে দেখা) 

Mon GitHub README চূড়ান্ত পলিশ 

Tue Resume bullet point আপডেট (নতুন AI স্কিল) 

Wed LinkedIn প্রোফাইল আপডেট 

Thu (ঐচ্ছিক) Free tier এ deploy — Render/Railway/Fly.io 

Fri �� চূড়ান্ত Milestone: সব কিছু resume/portfolio/GitHub এ live 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 17/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

PHASE 4 · WEEK 25+ 

**Job Search \+ Continuous Learning** 

এখান থেকে সক্রিয়ভাবে apply করা শুরু, আর শেখা কখনো থামানো যাবে না — 

industry দ্রুত বদলায়। 

**সপ্তাহ ফোকাস** 

25 সক্রিয়ভাবে apply শুরু, প্রতিদিন ৫–১০টা relevant remote job এ apply 

26 Interview আসলে project demo প্র্যাকটিস, ফিডব্যাক অনুযায়ী প্রজেক্ট/resume ঠিক করা চলমান নতুন AI technique শেখা থামবে না — প্রতি সপ্তাহে ১টা নতুন paper/blog পড়া চালিয়ে যাওয়া 

05 **Milestone Checklist** 

Week 6: Foundation project কাজ করছে, apply শুরু 

Week 13: Multi-agent সিস্টেম সম্পূর্ণ 

Week 15: Multimodal ফিচার যুক্ত 

Week 17: Fine-tuned মডেল কাজ করছে 

Week 18: Observability সম্পূর্ণ 

Week 20: Production-grade logging/tracing সম্পূর্ণ 

Week 22: System design mock interview কনফিডেন্ট 

Week 24: Resume/GitHub/LinkedIn সম্পূর্ণ পর্ণ লিশড 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 18/19  
8/12/26, 1:41 PM AI Engineering — ৬ মা সে র Roadmap 

Week 25+: সক্রিয়ভাবে apply করছি 

06 **গুরুত্বপূর্ণ নির্ণ য়ম — সবসময় মনে রাখতে হবে** 

1 **প্রতিদিন ১–১.৫ ঘণ্টা** — এর বেশি জোর করে করার দরকার নেই, ধারাবাহিকতাই আসল 2 **শুধুপড়ো না, কোড করো** — প্রতিটা টপিকের পর হাতে-কলমে implement বাধ্যতামূলক **সপ্তাহে একদিন (Friday) শুধু review** — আগের সব একসাথে ঝালাই করা 3 

4 **স্টাক হলে ৩০ মিনিটের বেশি না** — নোট করে এগিয়ে যাও, পরে ফিরে এসো 

5 **একটাই project** — নতুন কিছু শিখলে এই একই প্রজেক্টে যোগ করবে 

6 **$0 বাজেট** — সবসময় Ollama/pgvector/local tool ব্যবহার 

**Foundation (Week 6\) শেষ হলেই apply শুরু** — depth phase এর জন্য অপেক্ষা করবে না 7 AI Engineering Roadmap · 26 Weeks · Generated for personal use 

file:///C:/Users/PC-4/AppData/Local/Temp/claude/c--Users-PC-4-Desktop-Proxy-Portal-proxy-api/399e6816-14ac-4b21-8143-b661264b13a0/scratch… 19/19