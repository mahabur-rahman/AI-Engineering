# Week 1 - Day 5

## LLM Streaming

আজকের লক্ষ্য: LLM streaming কী, কেন দরকার, কিভাবে কাজ করে, এবং কীভাবে আমরা local Ollama + NestJS + Next.js দিয়ে streaming AI response implement করব।

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Model: Ollama local, `llama3.2:3b`
- Stack: NestJS + TypeScript + Next.js + local-first AI
- Learning goal: senior-level confidence on AI engineering fundamentals
- Previous milestone: Week 1 Day 4 structured output complete
- Goal for today: understand streaming deeply and implement a production-minded local streaming flow

## Day 5 working rules

- সবকিছু local Ollama-তে test করবে
- stream vs non-stream difference বুঝে implementation করবে
- raw network chunk, NDJSON, buffering, chunk parsing দেখে বুঝবে
- model inference velocity vs perceived responsiveness-এর পার্থক্য বুঝবে
- UI/UX, cancellation, error handling, observability, resource limits-কে গুরুত্ব দেবে
- শুধু local/free tools ব্যবহার করবে
- future roadmap topics (RAG, agents, queues, etc.) এ jump করবে না

---

# PART 1 — LEARNING OBJECTIVES

## 1. LLM streaming কী?

LLM streaming মানে হলো model token-by-token output produce করা, কিন্তু পুরো response একদম শেষে অপেক্ষা না করে ধীরে ধীরে client-কে পাঠানো।

সাধারণ non-streaming flow:

```text
Client -> API -> LLM -> wait until full answer -> send everything together
```

Streaming flow:

```text
Client -> API -> LLM -> first token arrives -> UI updates immediately -> more tokens follow
```

### Why this matters:

মানুষের জন্য latency perception খুব গুরুত্বপূর্ণ।

যদি model 10 সেকেন্ডে full answer generate করে, কিন্তু first output 300ms-এ আসতে থাকে, তাহলে user feels app is responsive.

---

## 2. Why LLMs stream responses

LLM model token-by-token generate করে।

- tokenizer output token serialize করে
- model compute করে
- response partial text আসতে থাকে
- client তা progressive display করতে পারে

### Simple analogy

Imagine a long answer being typed by a person word by word. If you wait for the whole paragraph before showing anything, user thinks it is slower. If you show each word as it is generated, the experience feels live.

---

## 3. Normal / non-streaming response vs streaming response

### Non-streaming

```json
{
  "response": "Hello, this is the complete answer."
}
```

- client complete response পায়
- final answer আসার পরেই UI updates
- perceived latency higher

### Streaming

```text
data: Hello

data: , this is

data: the complete answer.
```

- client incremental response পায়
- UI progressive render করে
- perceived responsiveness higher

---

## 4. Token generation concept

LLM inference is fundamentally sequential at token level.

Example:

```text
"The invoice is overdue because ..."
```

model token-by-token produce করে, যেমন:

```text
The
 invoice
 is
 overdue
 because
 ...
```

Need to understand:

- one token != one word
- one token may be fragment of word
- model outputs a sequence
- token generation depends on previous tokens

---

## 5. Why waiting for the complete response increases perceived latency

Because users experience time before any output visible. This is the critical difference between:

- total processing time
- user-visible responsiveness

A model may finish in 5 seconds total, but if nothing appears for 4.8 seconds, the user feels delay. Streaming improves the visible start of output.

---

## 6. Time To First Token (TTFT)

TTFT = time from request sent to first token received.

Use case:

- user sends prompt
- server forwards to Ollama
- first token gets back
- measured as TTFT

This is critical for chat UX.

---

## 7. Time To Last Token (TTLT)

TTLT = time from request start to the final token or final chunk completion.

This is full response duration.

In simple terms:

- TTFT = when response starts
- TTLT = when response ends

---

## 8. Inter-token latency

Inter-token latency = time between successive tokens/chunks.

This matters because:

- very high inter-token latency feels laggy
- unstable generation feels broken
- streaming with jitter can be frustrating

---

## 9. Time-to-first-byte vs TTFT

These are often confused.

### Time-to-first-byte (TTFB)

- first byte from server arrives to client
- network-level metric

### TTFT

- first model token arrives at application layer
- more user-centric metric

In AI systems, TTFT often means the first token seen by the client after prompt is sent.

---

## 10. Streaming vs polling

### Polling

Client repeatedly asks server: "Any new text yet?"

Problems:

- more requests
- extra latency
- wasted network
- polling interval mismatch

### Streaming

Server keeps connection open and pushes incremental updates.

Better for interactive chat.

---

## 11. Streaming vs WebSocket

### SSE

- server -> client push
- generally simpler
- use case: one-way updates / chat streaming
- built on HTTP

### WebSocket

- full-duplex, bidirectional
- more flexible
- suitable for chat, real-time game, collaborative editing

For AI chat, SSE is often easier and sufficient.

---

## 12. Streaming vs Server-Sent Events (SSE)

SSE is a standard HTTP mechanism for server-to-client streaming updates.

It is not the same thing as general streaming, but a common implementation choice.

SSE format:

```text
Content-Type: text/event-stream

 data: Hello

 data: world

```

- text/event-stream
- event boundary via blank lines
- data field repeated
- one-way stream from server to browser

---

## 13. HTTP chunked transfer concept

HTTP chunked transfer lets server send response in chunks without waiting for the full payload.

Instead of one large final response, the server may do:

```text
HTTP/1.1 200 OK
Transfer-Encoding: chunked

5
Hello

6
 world

0

```

This is the under-the-hood mechanism many streaming APIs use.

---

## 14. Backpressure concept

Backpressure means the consumer cannot keep up with producer speed. For example:

- server produces streaming chunks faster than browser can render
- network slower than generation
- client processing lagging behind

In streaming systems, you must manage flow control. In practice for local learning, this is less dramatic, but conceptually it's important.

---

## 15. Connection lifecycle

Streaming connection lifecycle includes:

- client creates request
- server opens stream
- partial data is sent
- stream ends or errors
- client closes connection or server closes it
- cleanup occurs

Need to handle:

- normal completion
- client disconnect
- server timeout
- model error

---

## 16. Why streaming is useful for chat applications

Chat UX demands:

- feel live
- show partial output quickly
- allow user to read while generation continues
- detect issues early

Streaming improves user perception dramatically.

---

## 17. Why streaming does NOT necessarily make model inference faster

Important point:

Stream does not magically make the model produce tokens faster.

Inference still takes same compute time. It only changes how output is delivered.

So:

- streaming != faster model
- streaming = better perceived responsiveness

---

## 18. How streaming improves perceived latency

Because user sees data early, even if:

- inference is still 4–8 seconds
- full output arrives later

The user feels the app is interactive and alive.

This is one of the most important AI UX ideas.

---

# PART 2 — OLLAMA STREAMING

## 1. Ollama local API

Ollama supports both:

- `/api/generate`
- `/api/chat`

Both can stream output.

---

## 2. `/api/generate`

Non-streaming example:

```bash
curl --max-time 60 -sS http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Explain what an invoice is.",
    "stream": false
  }'
```

Streaming example:

```bash
curl --max-time 60 -sS http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Explain what an invoice is.",
    "stream": true
  }'
```

---

## 3. `/api/chat`

Chat-based streaming uses conversation format.

Example:

```bash
curl --max-time 60 -sS http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Explain what an invoice is." }
    ],
    "stream": true
  }'
```

---

## 4. stream: true vs stream: false

### stream: false

- one final JSON object returned
- easier to parse
- no progressive UX
- waits for completion

### stream: true

- multiple JSON objects or chunks arrive over time
- each chunk may include partial text
- you need to observe incremental updates
- suitable for chat UI and live response

---

## 5. NDJSON concept

NDJSON = Newline-Delimited JSON.

Each line is a JSON object.

Example:

```json
{"model":"llama3.2:3b","response":"Hel","done":false}
{"model":"llama3.2:3b","response":"lo","done":false}
{"model":"llama3.2:3b","response":" there!","done":true}
```

Important:

- not one single object
- multiple objects in sequence
- each chunk can be partial
- final chunk often has `done: true`

---

## 6. Why multiple JSON objects arrive instead of one large JSON response

Because the server streams incremental output across a network connection. A single large response is not always practical for interactive UI. Streaming is a transport pattern, not just a model pattern.

---

## 7. How each chunk should be processed

For each chunk:

- read raw text
- split by newline
- ignore empty lines
- parse JSON line-by-line
- accumulate `response` field
- stop when final `done` or end-of-stream

---

## 8. How the final chunk is detected

Ollama usually sends final message with:

```json
{"done": true}
```

or final chunk includes final content plus done flag.

Important: final chunk may be partial or may include the last text segment.

---

## 9. How errors appear during streaming

Possible errors:

- Ollama process not running
- model not found
- invalid request
- malformed NDJSON line
- network disconnect
- client disconnect
- server timeout

Common observation:

- stream ends without `done: true`
- parse error due to broken chunks
- one line is incomplete JSON

---

# PART 3 — FIRST HANDS-ON OLLAMA TEST

## Step 1: Verify Ollama is running

```bash
curl http://127.0.0.1:11434/api/tags
```

Expected output: installed models list.

---

## Step 2: Verify model exists

```bash
curl -sS http://127.0.0.1:11434/api/tags | jq
```

Check whether `llama3.2:3b` is present.

---

## Step 3: First non-streaming request

```bash
curl --max-time 60 -sS http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Explain what an invoice is in 2 sentences.",
    "stream": false
  }'
```

What to observe:

- one final JSON object
- full response appears after completion
- easier to inspect

---

## Step 4: Streaming request

```bash
curl --max-time 60 -sS http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Explain what an invoice is in 2 sentences.",
    "stream": true
  }'
```

What to observe:

- multiple output chunks
- partial tokens appear over time
- timing between chunks
- final completion event

---

## What to look for in terminal output

- response structure
- number of chunks
- first chunk vs final chunk
- `done` flag
- content accumulation
- time between tokens/chunks

---

# PART 4 — BUILD A SMALL NODE.JS STREAMING CLIENT

Before NestJS, we need to understand raw streaming. This is very important because streaming is lower-level than it looks.

## Why Node.js raw client matters

The browser is not the only streaming consumer. We need to understand:

- ReadableStream
- fetch
- Uint8Array
- TextDecoder
- buffering
- chunk splitting
- JSON.parse

---

## 4.1 Native fetch() example

```js
const response = await fetch('http://127.0.0.1:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2:3b',
    prompt: 'Explain what an invoice is.',
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  buffer += chunk;

  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      console.log(parsed);
    } catch (error) {
      console.error('Malformed line:', trimmed);
    }
  }
}
```

---

## 4.2 Why network chunk is not equal to one JSON object

This is a critical concept.

Network may receive:

```text
chunk 1: {"response":"Hel
```

```text
chunk 2: lo","done":false}
```

If you parse immediately, you get invalid JSON.

Therefore, we need buffering and newline-based parsing.

---

## 4.3 Correct basic NDJSON streaming parser

```js
async function streamOllamaText(prompt) {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt,
      stream: true,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.response) {
          fullText += parsed.response;
          process.stdout.write(parsed.response);
        }

        if (parsed.done) {
          console.log('\n[done]');
          return fullText;
        }
      } catch (error) {
        console.error('Malformed NDJSON chunk:', trimmed);
      }
    }
  }

  return fullText;
}
```

### Important lesson

Do not hide this complexity behind a library too early. Understand the mechanics first.

---

# PART 5 — NESTJS IMPLEMENTATION

Now we integrate streaming into the existing NestJS project.

## Suggested structure

```text
src/
  modules/
    ai/
      ai.controller.ts
      ai.service.ts
      ai.types.ts
```

If repository architecture already exists, adapt accordingly.

---

## 5.1 Why normal JSON response is not ideal for streaming

A normal JSON response waits until entire answer is ready, then sends one big payload.

For streaming UI, we need:

- open connection
- incremental chunks
- immediate display
- cancellation support

---

## 5.2 Controller design

```ts
@Post('stream')
async streamResponse(
  @Body() body: { prompt: string },
  @Res() res: Response,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const aiService = new AiService();
  const stream = await aiService.streamFromOllama(body.prompt);

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
  }

  res.end();
}
```

---

## 5.3 Service design

Pseudo-implementation:

```ts
async streamFromOllama(prompt: string): Promise<ReadableStream> {
  const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: this.model,
      prompt,
      stream: true,
    }),
  });

  return response.body;
}
```

Then parse text in a stream loop and send partial updates downstream.

---

## 5.4 Streaming endpoint example

```http
POST /ai/stream
```

Request:

```json
{
  "prompt": "Explain what an invoice is."
}
```

Response is progressive, not one blob.

---

# PART 6 — SERVER-SENT EVENTS (SSE)

## 1. What is SSE?

SSE is a simple HTTP-based streaming mechanism where server pushes updates to client.

Use case:

- chat UI
- progress updates
- log tailing
- LLM streaming response

---

## 2. Why SSE is useful for LLM streaming

Because model output is naturally incremental. SSE lets us send partial data in a standard way.

---

## 3. Basic SSE format

```text
Content-Type: text/event-stream

 data: Hello

 data: there

 data: world
```

### Important rules

- each event often uses `data:` prefix
- blank line ends the event
- browser receives incremental chunks
- connection stays open until complete

---

## 4. SSE vs WebSocket

### SSE

- one-way push from server to client
- easier for browser-based chat
- works well with HTTP infrastructure
- great for LLM token streaming

### WebSocket

- bidirectional
- more complex
- useful when both directions are needed

For LLM chat, SSE is often a simpler and more production-friendly choice.

---

## 5. SSE limitations

- not full duplex
- browser support is good but still not universal for all custom clients
- not ideal for heavy bidirectional app state syncing

---

## 6. Last-Event-ID concept

SSE supports reconnecting and resuming from last event ID. This is helpful for reliability, but for local learning it is enough to understand the concept.

---

## 7. NestJS SSE endpoint example

```ts
@Get('stream')
stream(@Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let counter = 0;
  const timer = setInterval(() => {
    counter += 1;
    res.write(`data: ${JSON.stringify({ text: `chunk ${counter}` })}\n\n`);

    if (counter >= 5) {
      clearInterval(timer);
      res.end();
    }
  }, 300);

  res.on('close', () => {
    clearInterval(timer);
  });
}
```

Then the browser can consume:

```js
const source = new EventSource('/ai/stream');
source.onmessage = (event) => {
  const parsed = JSON.parse(event.data);
  console.log(parsed.text);
};
```

---

# PART 7 — NEXT.JS CLIENT

## Goal

Create a simple client that shows LLM output progressively.

### UI features

- input box
- send button
- streaming response area
- loading indicator
- error state
- stop/cancel button

---

## 7.1 Basic React/Next.js fetch SSE usage

```ts
const response = await fetch('/api/ai/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  buffer += chunk;

  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      setText((prev) => prev + (parsed.text ?? ''));
    } catch {
      // ignore incomplete chunk or partial line
    }
  }
}
```

---

## 7.2 Loading and error states

Use states like:

```ts
const [status, setStatus] = useState<'idle' | 'loading' | 'streaming' | 'done' | 'error'>('idle');
```

This gives UI clarity and helps with future debugging.

---

# PART 8 — STREAMING STATE MANAGEMENT

## 1. Recommended states

```text
idle
  -> loading
  -> streaming
  -> completed

or

idle
  -> loading
  -> streaming
  -> error

or

idle
  -> loading
  -> streaming
  -> cancelled
```

---

## 2. Why state transitions matter

If multiple requests overlap, stale data can appear. Example:

- user sends request A
- user sends request B quickly
- B completes first, then A arrives late
- UI may show wrong result

We need request lifecycle awareness and request IDs or cancellation logic.

---

## 3. Race condition example

```text
Request A started
Request B started
Response B arrives first
Response A arrives later
```

If not tracked properly, UI shows stale or mixed content. Use request IDs and active request guard.

---

# PART 9 — ABORT / CANCELLATION

## Why cancel matters

Users may:

- change their mind
- submit a new prompt
- need to stop a long generation

---

## AbortController example

```ts
const controller = new AbortController();
const signal = controller.signal;

const response = await fetch('/api/ai/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
  signal,
});

// later
controller.abort();
```

---

## Server-side impact

When client disconnects:

- server should stop writing to response
- cleanup should occur
- Ollama generation should ideally be cancelled too if possible

This requires careful cleanup and connection handling.

---

# PART 10 — ERROR HANDLING

Need to handle all major failure modes.

## 1. Ollama is down

What happens:

- fetch fails
- connection refused or timeout

Handle:

- return 503 or 502 appropriately
- show user-friendly message

---

## 2. Model does not exist

What happens:

- Ollama returns model-not-found error

Handle:

- reject request clearly
- log model name
- do not retry blindly

---

## 3. Invalid request

Examples:

- empty prompt
- oversized prompt
- invalid JSON body

Handle:

- 400 Bad Request
- clear validation error

---

## 4. Network interrupted

Possible symptoms:

- stream disconnects mid-way
- `done` never arrives

Handle:

- log partial info
- mark as incomplete or failed
- client should show error/status

---

## 5. Client disconnects

Handle cleanup.

- stop sending response
- close stream
- clear timers
- maybe cancel upstream generation

---

## 6. Malformed NDJSON

What happens:

- a chunk is incomplete JSON
- parser throws

Handle:

- buffer until complete line
- if still invalid, log and stop

---

## 7. JSON parsing failure

What happens:

- stream data is not valid JSON after newline splitting

Handle:

- catch parse error
- track malformed stream chunk
- avoid crashing entire response

---

## 8. Stream ends unexpectedly

What happens:

- connection closes before `done` flag

Handle:

- treat as interrupted response
- log last successful chunk position
- UI can show partial output and mark incomplete

---

## 9. Timeout

Handle explicit timeout logic.

- request timeout at server
- upstream timeout to Ollama
- client-side abort timeout if needed

---

## 10. User cancels request

Handle gracefully.

- abort fetch
- stop queueing data
- clean resources
- no infinite retries

---

# PART 11 — PERFORMANCE CONCEPTS

## 1. TTFT

Time to first token is the most important UX metric.

Goal: minimize time before first meaningful output is visible.

---

## 2. tokens/sec

Tokens per second indicate generation throughput.

This matters for understanding model speed, but not as much as UX/perceived latency.

---

## 3. throughput

Throughput measures how much text is produced over time.

---

## 4. latency

Overall time from request start to completion.

---

## 5. perceived latency

User experience is not the same as raw latency. Streaming makes it feel faster.

---

## 6. buffering

Need to avoid unnecessary buffering at many layers:

- server buffering
- proxy buffering
- client accumulation before render

For real-time AI output, stream immediately.

---

## 7. proxy buffering

Some proxies or infrastructure may buffer responses unexpectedly. That breaks streaming UX and increases latency.

---

## 8. memory usage

With many concurrent streaming connections, memory usage increases.

Need to consider:

- number of open connections
- buffer size per connection
- client memory usage
- server memory tightening for 8GB machine

---

## 9. concurrent streams

Many streams at once can saturate CPU and memory. In local learning, maybe only a few are active, but in production you need concurrency controls.

---

## 10. streaming != faster inference

Critical senior-level understanding:

- streaming does not reduce the model’s processing cost
- it reduces perceived delay for users

---

# PART 12 — SECURITY CONSIDERATIONS

## 1. Prompt input validation

Always validate prompt input length and type.

---

## 2. Request size limits

Large prompts can consume memory and CPU. Use limits.

---

## 3. Rate limiting

Prevent abusive requests, especially for local or shared infrastructure.

---

## 4. Connection limits

Protect from too many open streams.

---

## 5. Authentication and authorization

Even for local experiments, production flow must separate client identity and permission checks.

---

## 6. Resource exhaustion

Long prompts + long outputs + many users can create DoS-like resource spikes.

---

## 7. Malicious long prompts

Need validation and timeouts.

---

## 8. Streaming abuse

Repeated streaming requests can exhaust server resources.

---

## 9. Timeout and max generation limit

Always configure maximum generation length and response timeouts.

---

# PART 13 — OBSERVABILITY

Need small but meaningful logging foundation.

Track:

- request start
- request ID
- model name
- TTFT
- total duration
- number of chunks
- completion status
- error status
- cancel state

Example:

```ts
console.log({
  requestId,
  model,
  startedAt: Date.now(),
  status: 'streaming',
});
```

Then log when:

- first token received
- stream finished
- stream errored
- stream cancelled

---

# PART 14 — CODING EXERCISES

## Exercise 1: Call Ollama via curl

Objective:

- Verify streaming API works

What to implement:

- send a non-streaming request
- send a streaming request

Expected behavior:

- response returns text
- chunked output appears in terminal

Common mistakes:

- forgetting `stream: true`
- using wrong endpoint
- not installing model

---

## Exercise 2: Compare stream true vs false

Objective:

- Understand the difference clearly

What to implement:

- run same prompt twice

Expected behavior:

- one request returns full payload at end
- one stream returns incremental chunks

---

## Exercise 3: Build Node.js streaming client

Objective:

- parse raw streaming response correctly

What to implement:

- fetch + ReadableStream + buffer logic

Expected behavior:

- app prints partial output progressively

Common mistakes:

- JSON.parse partial chunk
- not splitting on newline
- forgetting buffer flush

---

## Exercise 4: Build NDJSON parser

Objective:

- parse chunked JSON safely

What to implement:

- line-by-line parse
- handle incomplete lines

Expected behavior:

- text accumulates without crashes

---

## Exercise 5: Build NestJS streaming endpoint

Objective:

- expose AI streaming via application API

What to implement:

- controller + service
- progressive output

Expected behavior:

- response visible progressively

---

## Exercise 6: Convert it to SSE

Objective:

- understand HTTP streaming protocol

What to implement:

- set `text/event-stream`
- send `data:` frames

Expected behavior:

- browser receives event stream

---

## Exercise 7: Build Next.js streaming UI

Objective:

- show token stream in browser

What to implement:

- text input
- send button
- streaming output panel

Expected behavior:

- text is appended progressively

---

## Exercise 8: Add AbortController

Objective:

- allow stop generation

What to implement:

- abort request on button click

Expected behavior:

- request stops cleanly

---

## Exercise 9: Add error handling

Objective:

- handle failure scenarios gracefully

Expected behavior:

- error messages shown clearly
- app does not crash

---

## Exercise 10: Measure TTFT and total time

Objective:

- understand performance metrics

What to implement:

- timestamp before request
- timestamp on first chunk
- timestamp on completion

Expected behavior:

- compute TTFT and TTLT

---

## Exercise 11: Add basic request logging

Objective:

- debug production-like flow

What to implement:

- request ID, model, timestamps, status

Expected behavior:

- logs give a trace of the lifecycle

---

## Exercise 12: Simulate malformed stream and handle it

Objective:

- harden parser

What to implement:

- force invalid JSON chunk
- verify parser catches malformed input

Expected behavior:

- parser logs error and fails gracefully

---

# PART 15 — FLAGSHIP PROJECT INTEGRATION

This Day 5 learning should connect to the AI Business Copilot vision.

Target flow:

```text
User
  ↓
Next.js Chat UI
  ↓
NestJS
  ↓
Ollama
  ↓
Streaming response
  ↓
Next.js progressively displays result
```

This is the foundation for:

- RAG answers
- agent reasoning steps
- tool calls
- multi-step workflows
- invoice processing and business decision support

But do not implement future topics today. Focus only on streaming as the foundational transport layer.

---

# PART 16 — COMMON MISTAKES

## 1. Assuming one network chunk = one token

Not true. Streaming network chunks are arbitrary sized chunks that do not align with token boundaries.

## 2. Assuming one network chunk = one JSON object

Also false. One JSON object may span multiple chunks or one chunk may contain multiple objects.

## 3. JSON.parse() on incomplete data

This causes parse errors. Must buffer.

## 4. Buffering whole response before sending it

This defeats the purpose of streaming. Send incrementally.

## 5. Forgetting Content-Type

Must use `text/event-stream` or appropriate streaming response type.

## 6. Forgetting connection cleanup

Open streams must be closed correctly.

## 7. No timeout

Long hanging streams become resource problems.

## 8. No cancellation

Users will expect stop generation to work.

## 9. Infinite retry

Bad for error loops. Retry only when appropriate.

## 10. Confusing SSE with WebSocket

These are different protocols and different trade-offs.

## 11. Thinking streaming reduces model compute cost

It does not. It only changes delivery semantics.

## 12. Exposing raw internal errors

Do not leak internal stack traces to users.

## 13. Ignoring resource limits

Local environment is limited; must respect CPU, RAM, and concurrency.

---

# PART 17 — SENIOR ENGINEER INTERVIEW PREPARATION

## 1. What is LLM streaming?

Short answer:

Streaming is the incremental delivery of model-generated output as tokens/chunks arrive instead of waiting for the full answer.

Senior answer:

It is an application-layer optimization for responsiveness. It does not change inference semantics, but it dramatically improves perceived latency and enables real-time user experience.

---

## 2. Why do LLM applications use streaming?

Because chat UX feels faster and more natural. It reduces perceived latency and enables progressive rendering. This is fundamental for AI-facing product experiences.

---

## 3. What is TTFT?

Time to first token. It measures the delay until the first model output arrives.

---

## 4. What is the difference between TTFT and total latency?

TTFT is the start of output. Total latency is the complete end-to-end time until the last token is received. Streaming can reduce perceived delay even when total latency remains the same.

---

## 5. Does streaming make inference faster?

No, not necessarily. It improves responsiveness but not necessarily the raw model compute.

---

## 6. What is NDJSON?

A line-delimited JSON format where each line is a complete JSON object.

---

## 7. Why can't you assume one network chunk equals one JSON object?

Because network transport splits data arbitrarily. You must buffer and parse line by line.

---

## 8. How would you parse an NDJSON stream safely?

Read bytes, decode to text, buffer, split by newline, parse each complete line, handle malformed lines, and stop on completion.

---

## 9. What is SSE?

SSE is a server-push HTTP mechanism for sending incremental events to clients over an open connection.

---

## 10. SSE vs WebSocket?

SSE is simpler, one-way, HTTP-based; WebSocket is bidirectional and more general.

---

## 11. Why choose SSE for an LLM chat?

Because the server mostly pushes generation output to the client; the client generally sends only prompts and control actions.

---

## 12. How does AbortController work?

It lets the client cancel an in-flight fetch request. The fetch and network layer cooperate to abort the request and clean up.

---

## 13. What happens when the client disconnects?

The server should stop writing, clean up timers, cancel upstream work if possible, and avoid leaking resources.

---

## 14. How do you prevent infinite streaming?

Timeouts, generation limits, request limits, and cleanup logic. Never let stream loops continue forever.

---

## 15. How do you handle malformed streamed data?

Buffer safely, validate parseability, log malformed chunks, fail gracefully, and never crash the whole app.

---

## 16. How would you monitor streaming performance?

Track TTFT, total response time, number of chunks, completion status, errors, cancellations, and concurrency.

---

## 17. How would you handle 1,000 concurrent streaming connections?

Need concurrency limits, memory budget, timeouts, and infrastructure controls. It becomes an operational system design problem.

---

## 18. What are the memory/CPU implications?

More open streams means more buffers, more CPU for parsing, and more memory pressure. This matters especially on a constrained 8GB machine.

---

## 19. How would you secure a streaming endpoint?

Validate input, set limits, enforce auth, add rate limits, and never expose raw internal errors.

---

## 20. How would you design LLM streaming in production?

Use request ID tracing, concurrency controls, timeout policies, observability, graceful cancellation, and a structured stream handler that separates model calls from client transport.

---

# PART 18 — SYSTEM DESIGN CONNECTION

Today’s concept fits into larger AI system design:

```text
User
  ↓
API Gateway
  ↓
AI Service
  ↓
LLM
  ↓
Streaming Layer
  ↓
Client
```

This becomes more interesting when later adding:

- RAG retrieval
- tool execution
- agents
- queues for async tasks
- caching
- observability dashboards
- policy enforcement

But for Day 5, do not implement them yet. Focus on one clean streaming path from prompt to client.

---

# PART 19 — DAY 5 CHECKLIST

## Theory

- [ ] I understand what LLM streaming is
- [ ] I understand why streaming is useful
- [ ] I understand token generation and partial output
- [ ] I understand TTFT, TTLT, and inter-token latency
- [ ] I understand streaming vs polling
- [ ] I understand SSE vs WebSocket
- [ ] I understand chunked transfer and buffering
- [ ] I understand perceived latency vs actual model latency

## Hands-on

- [ ] I tested non-streaming Ollama request
- [ ] I tested streaming Ollama request
- [ ] I inspected chunks and parsed NDJSON
- [ ] I built a small Node.js streaming client
- [ ] I built a basic NestJS streaming endpoint
- [ ] I built a basic SSE endpoint
- [ ] I built a basic Next.js streaming UI

## Code

- [ ] I can build a streaming parser
- [ ] I can handle partial chunks
- [ ] I can detect final chunk
- [ ] I can handle errors cleanly
- [ ] I can implement cancellation
- [ ] I have basic logging in place

## Debugging

- [ ] I know how to debug malformed JSON chunks
- [ ] I know how to debug no-first-token delay
- [ ] I know how to debug broken stream connection
- [ ] I know how to debug client disconnect handling

## Interview

- [ ] I can explain TTFT clearly
- [ ] I can explain SSE vs WebSocket
- [ ] I can explain why streaming is not faster inference
- [ ] I can explain NDJSON parsing
- [ ] I can explain cancelation and error handling

## Senior-level

- [ ] I understand resource concerns and concurrency limits
- [ ] I understand memory/CPU implications
- [ ] I understand API security around streaming
- [ ] I understand when to choose SSE vs WebSocket

## Flagship project

- [ ] I can see how streaming fits into AI Business Copilot
- [ ] I know the architecture path from UI to Ollama to user output

---

# PART 20 — FINAL MINI PROJECT

At the end of Day 5, I should have a working local streaming feature:

```text
Next.js
  ↓
NestJS
  ↓
Ollama
  ↓
Llama 3.2 3B
  ↓
Streaming output
  ↓
Progressively displayed in UI
```

## Requirements

- Local only
- $0 budget
- no paid API
- progressive visible output
- loading state
- error state
- cancel button
- basic logging
- TTFT measurement

---

# DAY 5 COMPLETION CRITERIA

I should not consider Day 5 complete until I can do all of the following:

- Explain what LLM streaming is in plain English
- Explain why streaming improves perceived latency
- Explain TTFT, TTLT, and inter-token latency
- Compare non-streaming vs streaming response flow
- Run non-streaming and streaming Ollama requests from terminal
- Explain NDJSON and why chunk boundaries are not guaranteed
- Write a working Node.js streaming client
- Build a basic NestJS streaming endpoint
- Explain SSE and when to use it
- Build a simple Next.js UI to show progressive output
- Add cancellation and error handling
- Add basic observability and request logging
- Explain the senior interview trade-offs

---

# IF I GET STUCK

Rules:

1. Spend maximum 30 minutes on one issue.
2. Debug systematically.
3. Write down the issue clearly.
4. Move forward if necessary.
5. Return later with fresh context.
6. Check one layer at a time: client, server, Ollama, network.
7. Never guess randomly.

---

## Final note

Day 5 is not just about “making something stream.”

This day is about understanding the real engineering truth:

- LLM inference is not magically faster with streaming
- user experience becomes noticeably better because users see output earlier
- robust streaming requires parsing, buffering, cancellation, error handling, and observability
- production-grade AI interfaces are built around latency perception, not just final response delivery

This is exactly the kind of understanding senior AI engineers and architecture-focused developers are expected to demonstrate.
