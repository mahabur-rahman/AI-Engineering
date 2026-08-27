# Week 1 - Day 2

## LLM API Basics

আজকের লক্ষ্য: NestJS থেকে local Ollama API call করা, আর সেই flow টা ভালোভাবে বোঝা.

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Model: Ollama local, `llama3.2:3b`
- Stack: NestJS + TypeScript
- Learning style: deep learner, step-by-step
- Goal: AI Engineering basic to master level

## What I need to understand today

1. LLM API কী
2. HTTP request/response কীভাবে কাজ করে
3. Ollama `POST /api/generate` contract
4. NestJS controller/service separation
5. Controller -> Service -> Ollama -> response flow
6. Error handling basics
7. Streaming vs non-streaming idea

## Day 2 target architecture

```text
Client
  -> NestJS Controller
  -> AI Service
  -> Ollama HTTP API
  -> LLM model
  -> Ollama response
  -> AI Service
  -> Controller
  -> Client
```

## Today’s practical goal

Build one simple endpoint:

```http
POST /ai/generate
```

Example request:

```json
{
  "prompt": "Explain dependency injection"
}
```

Example response:

```json
{
  "answer": "..."
}
```

## Step-by-step plan for today

### Step 1: Understand LLM API basics

Learn:

- API
- client/server communication
- HTTP method
- URL
- headers
- JSON body
- status code
- request lifecycle

Focus:

- Why an LLM API is just an HTTP API with model-specific behavior
- Why LLM calls can be slower than normal REST calls

### Step 2: Understand Ollama API contract

Study:

```http
POST /api/generate
```

Important fields:

- `model`
- `prompt`
- `stream`
- `response`

For today, understand the contract, not memorization.

### Step 3: Keep NestJS structure clean

Create or keep this structure:

```text
src/
  ai/
    ai.module.ts
    ai.controller.ts
    ai.service.ts
```

Rules:

- Controller handles HTTP
- Service handles Ollama call
- Module wires them together

### Step 4: Build controller

The controller should:

- accept request
- validate input shape
- call service
- return response

Do not put Ollama logic in controller.

### Step 5: Build service

The service should:

- receive prompt
- build Ollama request
- call local API
- extract generated answer
- return clean app-level result

### Step 6: Test the flow

Verify:

- app starts
- endpoint exists
- Ollama responds
- answer returns in API response

## Done criteria

Day 2 is done when:

- I can explain LLM API basics in my own words
- I understand Ollama generate request/response shape
- NestJS controller and service roles are clear
- `POST /ai/generate` works locally
- I can describe the full request flow end-to-end

## Things to remember

- Keep it local-first
- Keep it simple
- Do not jump to agents or RAG yet
- First learn the basic API call perfectly
- One working slice is better than many half-done ideas

## Senior-level questions I should be able to answer

1. What is an LLM API?
2. Why separate controller and service in NestJS?
3. What makes an LLM request slower than a normal REST request?
4. When would I use streaming instead of a normal response?
5. What can go wrong when calling a local model API?

## My sync note

If I get stuck today, I should stop and write down:

- what I tried
- what I expected
- what happened
- the exact error message

Then continue from there instead of changing the whole plan.

