# Week 1 - Day 7

## Structured Output, JSON Schema, and Validation Basics

আজকের দিন theory-first. Day 7-এ আমরা বুঝবো কীভাবে LLM-এর outputকে structured format-এ force করা যায়, JSON schema কী, validation কীভাবে কাজ করে, এবং production AI system-এ schema validation কেন absolutely important.

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Model: Ollama local, `llama3.2:3b`
- Stack: NestJS + TypeScript + local AI
- Previous milestone: Week 1 Day 6 complete
- Today’s goal: understand structured generation and validation before implementing any code
- Focus: concepts first, implementation later

## Day 7 working rules

- একবারে একটা concept ধরে বুঝবে
- schema validation কেন দরকার সেটা আগে বুঝবে
- prompt + output contract + validation এই তিনটা একসাথে চিন্তবে
- theory আগে, coding পরে
- “LLM output valid” বলতে না, “how we verify it” বুঝবে
- local learning scope ঠিক রাখবে

---

# PART 1 — LEARNING OBJECTIVES

## 1. Day 7-এ কী কী বুঝতে হবে?

By the end of Day 7, I should be able to explain:

- structured output কী
- why LLM output is often messy without schema constraints
- JSON output format কী
- schema কী
- JSON schema basics
- validation কী
- parse vs validation
- why parsing alone is not enough
- Zod কী
- how schema validation helps production AI systems
- common structured-output failure modes
- why schema enforcement matters for business automation

---

## 2. Why structured output matters

LLM typically generates text, not guaranteed structured data.

Example:

```text
The invoice is overdue. The customer is ACME Corp. Amount is 2500.
```

This is natural language. But business logic needs structured shape like:

```json
{
  "invoiceId": "INV-1001",
  "customer": "ACME Corp",
  "amount": 2500,
  "status": "overdue"
}
```

Without structure, app logic cannot reliably use the result.

That is why structured output is important.

---

# PART 2 — WHY LLM OUTPUT IS NOT RELIABLE BY DEFAULT

## 1. LLM generates tokens, not guaranteed JSON

Model outputs next tokens based on probability. It does not inherently know “this must be valid JSON”.

So output may include:

- extra explanation
- markdown fences
- trailing commas
- invalid syntax
- wrong field names
- mixed languages
- invented values

This is common.

---

## 2. Example of bad output

```text
Sure! Here's the invoice info:
{
  invoiceId: INV-1001,
  customer: ACME Corp,
  amount: "$2500"
}
```

This is not valid JSON because:

- keys are not quoted
- commas and type format wrong
- may still look almost correct to a human

---

## 3. Why we need a contract

AI system needs an output contract.

Example contract:

```json
{
  "invoiceId": "string",
  "customer": "string",
  "amount": 2500,
  "status": "draft | sent | paid | overdue"
}
```

Then the model output can be validated against that contract.

---

# PART 3 — WHAT IS STRUCTURED OUTPUT?

## 1. Simple definition

Structured output means:

- output is in a predictable shape
- keys are known
- value types are known
- easy to parse and validate

Typical examples:

- JSON object
- array of objects
- fixed enum values
- numbers and booleans in exact positions

---

## 2. Example

Prompt:

```text
Return only JSON with keys: invoiceId, customer, amount, dueDate, status.
```

Expected:

```json
{
  "invoiceId": "INV-1001",
  "customer": "ACME Corp",
  "amount": 2500,
  "dueDate": "2026-08-31",
  "status": "overdue"
}
```

This is easier to process than plain English.

---

# PART 4 — JSON AND JSON SCHEMA

## 1. JSON basics

JSON is a data format:

- object = { ... }
- array = [ ... ]
- string = "text"
- number = 42
- boolean = true / false
- null = null

This is common in AI systems because many apps can consume JSON easily.

---

## 2. JSON schema basics

JSON Schema is a way to describe the structure and constraints of a JSON document.

Example:

```json
{
  "type": "object",
  "required": ["invoiceId", "customer", "amount", "status"],
  "properties": {
    "invoiceId": { "type": "string" },
    "customer": { "type": "string" },
    "amount": { "type": "number" },
    "status": {
      "type": "string",
      "enum": ["draft", "sent", "paid", "overdue", "cancelled"]
    }
  },
  "additionalProperties": false
}
```

This says:

- must be an object
- required keys must exist
- types must match
- status must be one of allowed values
- extra keys are not allowed

---

## 3. Why schema is important

Because it gives us a contract:

- predictable output shape
- easier validation
- easier downstream logic
- easier integration with app code

---

# PART 5 — VALIDATION

## 1. Validation means checking output against expected contract

Example flow:

```text
LLM output
  ↓
parse JSON
  ↓
validate schema
  ↓
if valid -> use it
if invalid -> reject or retry
```

This is critical.

---

## 2. Parse vs validation

### Parse

Converting string into a JavaScript object.

If the response is malformed JSON, parse fails.

### Validation

Checking whether the object obeys the expected shape and rules.

Even valid JSON can still be wrong semantically.

Example:

```json
{
  "invoiceId": "INV-1001",
  "customer": "ACME Corp",
  "amount": "not-a-number",
  "status": "unknown"
}
```

This parses, but fails validation.

---

## 3. Why validation is not optional

AI output can be superficially plausible but structurally wrong.

In production, we need:

- parse check
- schema check
- business rule check
- fallback behavior when invalid

---

# PART 6 — ZOD

## 1. Zod কী?

Zod is a TypeScript validation library.

It lets us define a schema and validate data at runtime.

Example:

```ts
const InvoiceSchema = z.object({
  invoiceId: z.string(),
  customer: z.string(),
  amount: z.number(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
});
```

Then:

```ts
const parsed = InvoiceSchema.parse(data);
```

If invalid, it throws.

---

## 2. Why Zod is useful in AI engineering

Because LLM outputs are noisy. Zod lets us verify responses before using them in app logic.

This is a common pattern:

```text
model output -> parse -> validate -> app logic
```

---

# PART 7 — WHY SCHEMA VALIDATION IS ESSENTIAL FOR BUSINESS AI

## 1. Example: invoice extraction

Without validation:

```text
The invoice is for ACME Corp and total is $2500.
```

This is okay as text, but not safe to feed into an invoice workflow.

With validation:

```json
{
  "invoiceId": "INV-1001",
  "customer": "ACME Corp",
  "amount": 2500,
  "status": "overdue"
}
```

Now app logic can trust the shape.

---

## 2. Example: fraud detection

If output is:

```json
{
  "isFraud": true,
  "riskScore": "very high",
  "reason": "looks suspicious"
}
```

This is not useful unless validated.

We need exact types and ranges.

---

# PART 8 — COMMON STRUCTURED-OUTPUT FAILURE MODES

## 1. Extra text around JSON

```text
Here is the result:
```json
{...}
```
```

Need to strip markdown fences or reject output.

---

## 2. Missing required keys

```json
{
  "customer": "ACME Corp"
}
```

Validation fails because required fields missing.

---

## 3. Wrong value types

```json
{
  "amount": "2500"
}
```

String not number.

---

## 4. Invalid enum values

```json
{
  "status": "pending-review"
}
```

Not allowed by schema.

---

## 5. Extra properties

```json
{
  "invoiceId": "INV-1001",
  "customer": "ACME Corp",
  "amount": 2500,
  "status": "overdue",
  "secret": "x"
}
```

Validation can reject unknown keys if configured.

---

# PART 9 — PROMPTING + SCHEMA TOGETHER

## 1. Prompting helps

A good prompt says:

- return only JSON
- include only these keys
- no extra text
- use valid JSON
- use exact enum values

This improves chance of success.

But prompting alone is not enough.

---

## 2. Validation provides safety

Even with good prompt, output may still fail.

So production systems normally use:

- prompt constraints
- runtime schema validation
- retry or fallback logic

This is the real engineering pattern.

---

# PART 10 — WHERE THIS FITS IN AI ENGINEERING

## 1. Day 6 connection

Day 6 discussed generation parameters (temperature, top-k, top-p). Those affect randomness.

Day 7 is about controlling output shape after generation.

These two are complementary:

- Day 6: how tokens are selected
- Day 7: how we guarantee output shape

---

## 2. Example connection

- temperature low helps consistency
- schema validation ensures JSON contract
- prompt constraints ensure output format

This combination is common in production AI apps.

---

# PART 11 — INTERVIEW PREPARATION

## 1. What is structured output?

Answer: output in a consistent, machine-readable format like JSON.

## 2. Why is JSON better than free-form text for apps?

Because it is easy to parse, validate, and integrate into systems.

## 3. What is schema validation?

Checking that the output matches the expected structure and types.

## 4. Why is validation necessary even if the model follows the prompt?

Because prompts are not guarantees.

## 5. What is Zod?

A TypeScript schema validation library.

## 6. What is the difference between parse and validation?

Parse converts the raw string; validation checks semantics and contract.

---

# PART 12 — DAY 7 THEORY CHECKLIST

## FOUNDATION

- [ ] Structured output understood
- [ ] JSON basics understood
- [ ] Why LLM output is noisy understood
- [ ] Need for output contracts understood

## SCHEMA

- [ ] JSON schema basics understood
- [ ] Required fields understood
- [ ] Value types understood
- [ ] Enum constraints understood
- [ ] AdditionalProperties concept understood

## VALIDATION

- [ ] Parse vs validation understood
- [ ] Runtime validation importance understood
- [ ] Zod basics understood
- [ ] Failure modes understood

## PRODUCTION

- [ ] Prompt + validation interaction understood
- [ ] Structured output + temperature connection understood
- [ ] Reliability importance understood

---

# PART 13 — CODING COMES AFTER THEORY

This document is intentionally theory-first.

Later, after finishing the concepts, I will implement:

- JSON extraction prompts
- Zod schema validation
- prompt constraints for exact output
- retry logic for invalid JSON
- structured-output endpoint design in NestJS

But not yet. The focus now is understanding the theory.

---

# PART 14 — FINAL DAY 7 COMPLETION CRITERIA

I should be able to explain without notes:

- Why structured output is needed
- What JSON schema is
- Why validation is essential
- What Zod is
- Why parse alone is not enough
- Why prompt constraints + validation are both needed
- How this connects to Day 6 generation parameters

If I can explain these clearly, Day 7 is complete.

---

## Final note

Structured output is one of the most practical skills in production AI engineering.

Because the real goal is not just generating text — it is generating data that software can trust and process safely.
