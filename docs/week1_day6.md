# Week 1 - Day 6

## Chain-of-Thought + LLM Parameters

আজকের দিন মূলত theory-first. এই দিনটা বুঝতে হবে কীভাবে LLM output তৈরি হয়, কীভাবে prompt wording output change করে, আর decoding parameters কীভাবে next-token selection কে influence করে।

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Model: Ollama local, `llama3.2:3b`
- Stack: NestJS + TypeScript + local-first AI
- Previous milestone: Week 1 Day 5 complete
- Today’s goal: understand generation behavior deeply before any coding
- Focus: concepts first, implementation later

## Day 6 working rules

- একবারে একটা concept ধরে বুঝবে
- prompt ও parameter change রেখে compare করবে
- theory আগে, coding পরে
- “model output good” বলতে না, “why it happened” বুঝবে
- production mindset রাখবে, কিন্তু local learning scope ঠিক রাখবে
- Day 6-এ coding project নয়; conceptual mastery primary

---

# PART 1 — LEARNING OBJECTIVES

## 1. Day 6-এ কী কী বুঝতে হবে?

By the end of Day 6, I should be able to explain:

- Chain-of-Thought (CoT) কী
- Why reasoning-style prompting can help with complex tasks
- What “reasoning” means in LLM context
- What is token prediction
- What is autoregressive generation
- What is probability distribution over next tokens
- What is decoding
- What is sampling
- What is greedy decoding
- What is temperature
- What is top-k
- What is top-p
- How temperature changes randomness
- How top-k changes candidate selection
- How top-p changes candidate selection
- How these parameters interact
- Deterministic vs stochastic generation
- Reproducibility and why same prompt can produce different output
- Why lower temperature does not guarantee factual correctness
- Why higher temperature does not automatically mean “better”
- When to use lower vs higher temperature
- Which parameters matter in production AI systems
- Which parameters should not be blindly tuned

---

## 2. Simple mental model

LLM কাজ করে এমনভাবে:

```text
Prompt
  ↓
Tokenization
  ↓
Model reads context
  ↓
Predicts probability for next token
  ↓
Decoding picks one token
  ↓
Token appended to context
  ↓
Repeat until stop condition
```

এটাই Day 6-এর base understanding.

---

# PART 2 — TOKEN GENERATION REFRESH

## 1. Prompt থেকে কী শুরু হয়?

Prompt string-কে tokenizer ভেঙ্গে token-এ পরিণত করে।

Example:

```text
Input: "I love"
```

Possible next tokens could be:

- " programming" → 0.60
- " coding" → 0.20
- " pizza" → 0.05
- " this" → 0.10

এগুলো illustrative probabilities. প্রকৃত LLM-এ সেগুলো অনেক বেশি complex.

### Important point

Model output করে probability distribution over next token. তারপর decoding strategy সেটি থেকে আসল token বেছে নেয়।

---

## 2. Why decoding strategy matters?

Same probability distribution হলেও different decoding methods different token নির্বাচন করতে পারে।

Example:

- greedy decoding → সর্বোচ্চ probability token take করে
- sampling → distribution থেকে random choice করে

এইটাই Day 6-এর core.

---

# PART 3 — WHAT IS DECODING?

## 1. Decoding কী?

Decoding মানে হলো model-এর output probability distribution থেকে আসল token নির্বাচন করা।

Model নিজে “final answer” তৈরি করে না; সে probability distribution তৈরি করে। তারপর decoding layer সেই distribution থেকে one token বেছে নেয়।

---

## 2. Greedy decoding

Greedy decoding মানে:

- সর্বোচ্চ probability টোকেনটাই বেছে নাও
- others ignore করো

Example:

```text
A = 0.70
B = 0.20
C = 0.10
```

Greedy decoding → A select করবে।

### Advantages

- deterministic
- predictable
- good for structured output and extraction

### Limitations

- repetitive output
- less creative variation
- may get stuck choosing safe token

---

## 3. Sampling

Sampling মানে:

- probability distribution দেখে random choice করা
- high-probability items more likely, but not guaranteed

### Advantages

- more diverse output
- better for creativity and brainstorming

### Limitations

- less deterministic
- can be weird or off-topic
- more hallucination risk if not constrained

---

## 4. Deterministic vs stochastic generation

### Deterministic

- same prompt + same model + same settings = likely same output
- good for reproducibility and testing

### Stochastic

- same prompt + same model + same settings = different outputs possible
- better for creativity, but less predictable

This is why AI outputs are not “always same”.

---

# PART 4 — TEMPERATURE

## 1. Temperature কী?

Temperature হলো token selection-এর randomness control করে।

Technical sense:

- probability distribution কে sharper বা flatter করে
- sharp distribution = very likely tokens dominate
- flat distribution = more varied tokens become plausible

---

## 2. Low temperature

Example:

```text
temperature = 0.1
```

Effects:

- model most likely chooses safest, most probable token
- output more deterministic
- less creative
- more repetitive / conservative
- often better for structured output and classification

### Use case

- JSON extraction
- invoice status classification
- support reply with strict format

---

## 3. High temperature

Example:

```text
temperature = 1.0 or above
```

Effects:

- candidate tokens spread out more
- random variation increases
- output becomes more creative
- higher hallucination or off-topic risk

### Use case

- brainstorming
- creative writing
- ideation

---

## 4. Temperature = 0

Conceptually:

- greedy behavior closest to deterministic choice
- choose maximum-probability token every time

In practice different runtimes handle this slightly differently, but the idea is the same: minimal randomness.

---

## 5. Why temperature is not intelligence

Temperature does not add knowledge.

It only changes how the model samples the next token from the probability distribution.

So:

- high temperature does not mean “smarter model”
- low temperature does not mean “more truthful model”

It only changes output randomness and distribution sharpness.

---

## 6. Intuitive analogy

Think of a restaurant menu:

- low temperature = you mostly pick the most obvious, safest dish
- high temperature = you are more willing to try weird, less likely options

That analogy helps understand randomness control.

---

# PART 5 — TEMPERATURE AND PROBABILITY DISTRIBUTION

## 1. Model কী তৈরি করে?

Model final logits তৈরি করে। logits হলো raw scores for each token.

Then softmax converts logits to probabilities.

Conceptual flow:

```text
logits
  ↓
temperature scaling
  ↓
softmax
  ↓
probability distribution
  ↓
sampling or greedy selection
```

---

## 2. Why temperature matters?

Temperature changes the sharpness of that distribution.

Example before scaling:

```text
A = 0.70
B = 0.20
C = 0.10
```

Low temperature:

- A becomes even more dominant
- B and C become less likely

High temperature:

- A is less dominant
- B and C become relatively more likely

This increases diversity but can also reduce reliability.

---

## 3. Important nuance

Temperature does not “fix” model knowledge. It simply changes the sampling strategy among probable tokens.

So if model is wrong, temperature may amplify wrong choices or produce more varied wrong answers.

---

# PART 6 — TOP-K

## 1. Top-k কী?

Top-k means: next token selection-এর জন্য only top k most likely tokens remain eligible.

Example:

```text
A = 0.40
B = 0.25
C = 0.15
D = 0.10
E = 0.05
F = 0.05
```

If top_k = 3, then only:

```text
A, B, C
```

remain candidates.

Then sampling happens only among those three.

---

## 2. When k is small

- fewer choices
- more deterministic
- output focused
- can be more repetitive

If k = 1, then effectively greedy-ish behavior.

---

## 3. When k is large

- many candidates allowed
- more novelty and randomness
- risk of irrelevant output

---

## 4. Advantages

- simple to understand
- controls candidate pool size
- useful for balancing creativity and safety

---

## 5. Limitations

- fixed number of candidates may not adapt well to different probability distributions
- not always as flexible as top-p

---

# PART 7 — TOP-P

## 1. Top-p কী?

Top-p or nucleus sampling means:

- cumulative probability threshold-based candidate set select করা
- token list টা ordered by probability
- যতক্ষণ cumulative probability threshold-এ পৌঁছায়, ততক্ষণ tokens eligible থাকে

Example:

```text
A = 0.40
B = 0.25
C = 0.15
D = 0.10
E = 0.05
F = 0.05
```

If top_p = 0.80:

- A = 0.40
- B = 0.25 => cumulative 0.65
- C = 0.15 => cumulative 0.80

So A + B + C are selected.

Potentially D onward are excluded.

---

## 2. Why it is called nucleus sampling

Because the selected set is the nucleus of probable tokens.

It dynamically changes candidate pool size based on probability mass.

---

## 3. Why top-p is useful

Because it adapts to the distribution.

Sometimes the top 3 tokens are enough, sometimes top 50 are needed. Top-p adapts automatically.

---

# PART 8 — TOP-K VS TOP-P

## 1. Quick comparison

### Top-k

- fixed number of candidates
- e.g. top 20 tokens only

### Top-p

- dynamic number of candidates
- keep adding until cumulative probability threshold is reached

---

## 2. When to use which?

### Top-k better when:

- you want a stricter cap on candidates
- you want predictable search space

### Top-p better when:

- you want dynamic candidate pool depending on distribution
- you want to preserve variety without too much noise

---

## 3. Senior-level understanding

Many modern systems do not treat these parameters in isolation. They tune them together with temperature and prompt engineering based on evaluation tasks.

No single “best value” works for every model and task.

---

# PART 9 — TEMPERATURE + TOP-K + TOP-P TOGETHER

## 1. Since all are connected

Conceptually the flow is:

```text
Model logits
  ↓
Temperature scaling
  ↓
Probability distribution
  ↓
Top-k / Top-p filtering
  ↓
Sampling
  ↓
Selected token
```

---

## 2. Why ordering can vary by runtime

Different frameworks and model runtimes implement decoding in slightly different ways.

So never assume:

- temperature always applied before top-p
- top-k always applied before temperature
- same model same runtime same library means identical behavior everywhere

You need to read the model/runtime docs and empirically validate behavior.

---

## 3. Practical engineering lesson

Tune parameters only after you know the task type.

- classification -> deterministic, low temperature
- creative writing -> higher randomness allowed
- structured extraction -> low temperature, strong constraints

---

# PART 10 — DETERMINISTIC VS NON-DETERMINISTIC OUTPUT

## 1. Deterministic generation

When same input and same settings produce the same result repeatedly.

This is useful for:

- testing
- evaluation
- contracts
- structured output

---

## 2. Stochastic generation

When output varies even with same prompt due to sampling.

This is useful for:

- brainstorming
- creative work
- multiple possible answers

---

## 3. Reproducibility

Production systems need reproducibility for debugging and evaluation.

That means:

- log prompt
- log model name
- log parameters
- fix random seed when possible
- record output version

---

## 4. Why same prompt can still produce different answers

Because:

- sampling adds randomness
- temperature changes distribution shape
- stochastic decoding uses randomness internally
- model may still produce different candidate paths

This is normal. It does not mean the system is broken.

---

# PART 11 — CHAIN-OF-THOUGHT (CoT)

## 1. CoT কী?

Chain-of-Thought prompting means model-কে explicitভাবে step-by-step reasoning করতে বলা।

Example:

```text
Solve this step by step.
First identify the numbers.
Then compute the discount.
Then apply tax.
Then give the final answer.
```

This differs from asking only:

```text
Give me the final answer.
```

---

## 2. Why CoT can help

Useful for:

- arithmetic
- logic tasks
- multi-step planning
- decomposition-heavy tasks

It gives the model a clearer task structure.

---

## 3. Simple example

Question:

"A product costs $100, gets 20% discount, then 10% tax is applied. Final price কী?"

Without CoT:

- model may jump directly to output

With CoT:

- calculate discount
- compute taxed amount
- produce final answer

This can lead to better reasoning quality in some tasks.

---

## 4. Important nuance

CoT is a prompting pattern, not proof of real internal reasoning. It can be useful, but it can also be verbose and wrong.

---

# PART 12 — CoT LIMITATIONS

## 1. It does not guarantee correctness

A model may produce convincing reasoning but still wrong final answer.

So:

- CoT helps structure reasoning
- it is not a guarantee
- it is not equivalent to “truth discovery”

---

## 2. It can increase latency

Longer reasoning means more tokens generated.

More tokens =

- more latency
- more cost
- more risk of weird or repetitive output

---

## 3. It can increase verbosity

The model may produce long explanations that are not needed in production.

---

## 4. It can mislead

A plausible-sounding explanation is not always true.

This is crucial in AI system design.

---

# PART 13 — CoT VS RAG VS TOOL CALLING

## 1. CoT

Reasoning strategy.

## 2. RAG

Retrieves external or domain-specific information.

## 3. Tool calling

Calls real functions like getInvoiceStatus or database lookup.

### Example

Question: "Invoice INV-123 status kemon?"

- CoT: logic-based reasoning about invoice situation
- RAG: fetch stored invoice data
- Tool calling: actual function call to system of record

### Important point

Reasoning alone cannot replace missing data or live tools.

---

# PART 14 — CoT VS PROMPT ENGINEERING

## 1. Prompt engineering

Larger umbrella concept. It includes:

- role prompting
- task instructions
- constraints
- examples
- structure
- error handling

## 2. CoT

One specific prompting style within prompt engineering.

It is useful, but not magic.

---

# PART 15 — TEMPERATURE AND TASK TYPES

## 1. Structured extraction

Best approach generally:

- clear schema
- lower temperature
- strong output constraints
- validation after generation

---

## 2. Classification

Goal: deterministic label.

Typical pattern:

- lower temperature
- short output
- force label only

---

## 3. Support reply drafting

Need helpful but not too random tone.

Typical pattern:

- moderate temperature
- clear instructions
- brand constraints

---

## 4. Brainstorming or ideation

Higher temperature may be acceptable.

---

## 5. Fraud detection or risky decisions

Need caution and calibration.

Temperature should not be tuned blindly; evaluation and guardrails matter more.

---

# PART 16 — PRODUCTION AI ENGINEERING

## 1. Model-specific behavior

Same prompt can behave differently on different models and runtimes.

So a parameter tuning decision must be validated per model.

---

## 2. Reproducibility matters

For production and testing, small differences in randomness can create regression issues.

This is why logging parameters and model version matters.

---

## 3. Evaluation beats intuition

Do not say:

“Temperature 0.8 feels better.”

Instead ask:

- Did accuracy improve?
- Did format compliance improve?
- Did latency worsen?
- Did output become more variable?

---

## 4. Trade-offs

Production AI systems always manage trade-offs among:

- quality
- latency
- cost
- determinism
- safety

Temperature is only one lever.

---

# PART 17 — PARAMETERS AND HALLUCINATION

## 1. Does lower temperature eliminate hallucination?

No.

## 2. Does higher temperature always cause hallucination?

No.

## 3. Does temperature control factuality directly?

Not directly.

Factual behavior depends on:

- model quality
- prompt quality
- retrieval context
- tool access
- verification layer
- evaluation pipeline

Temperature mainly affects token randomness.

This is a critical interview point.

---

# PART 18 — PARAMETERS AND STRUCTURED OUTPUT

Day 4-এ আমরা structured output and schema validation শিখেছি। Day 6-এ আমরা শিখছি decoding parameters কীভাবে output distribution কে influence করে।

These are related but different:

- decoding parameters control how tokens are selected
- schema validation ensures final output matches contract

So:

```text
LLM output
  ↓
parse
  ↓
validate schema
  ↓
use in app logic
```

Temperature alone does not replace validation.

---

# PART 19 — STREAMING CONNECTION

Day 5-এ streaming ছিল “কখন output আসবে, কীভাবে পাঠানো হবে।” Day 6-এ decoding parameters হলো “next token কীভাবে বেছে নেয়া হবে।” 

These are related but conceptually separate.

```text
Day 5: streaming = transport / delivery
Day 6: decoding = generation / selection
```

Important for interview: do not confuse them.

---

# PART 20 — INTERVIEW PREPARATION

## 1. What is temperature?

Simple answer:

Temperature controls randomness in token selection.

Senior answer:

Temperature scales the logits distribution. Lower values sharpen the distribution and make the model choose more likely tokens; higher values flatten it and allow more diversity, which can increase creativity but may also increase hallucination risk.

---

## 2. What happens when temperature is low?

- deterministic output
- low variance
- safer outputs
- often better for extraction and classification

---

## 3. What happens when temperature is high?

- more randomness
- more diversity
- less stable output
- higher chance of weird or off-topic generation

---

## 4. What is top-k?

Top-k keeps only the top k tokens as candidates.

---

## 5. What is top-p?

Top-p keeps tokens until the cumulative probability reaches a threshold.

---

## 6. Top-k vs top-p?

Top-k is fixed-size candidate list. Top-p is dynamic threshold-based candidate set.

---

## 7. What is greedy decoding?

Always choose the highest probability token.

---

## 8. What is sampling?

Choose the next token from the probability distribution rather than always the highest one.

---

## 9. What is CoT?

Prompting the model to reason in steps before giving the final answer.

---

## 10. Does CoT guarantee correctness?

No. It can help but can also produce plausible but wrong reasoning.

---

## 11. Why same prompt can produce different outputs?

Because decoding is stochastic, and sampling is random.

---

## 12. Does temperature solve hallucination?

No. It controls randomness, not factuality.

---

## 13. How to tune for production AI system?

Use evaluation, prompt constraints, model choice, validation layers, and trade-off analysis instead of blindly changing temperature.

---

## 14. Interview trap

“Temperature is intelligence.”

Wrong. Temperature is sampling control, not a model quality metric.

---

# PART 21 — THINK LIKE A SENIOR ENGINEER

## Scenario 1: Support agent gives inconsistent answers

Possible investigation:

- temperature too high
- prompt too vague
- no output constraints
- no schema validation
- no evaluation set

---

## Scenario 2: Fraud detector produces different classifications for the same input

What could cause it?

- randomness in decoding
- temperature too high
- no fixed seed
- inconsistent prompt/context
- different model version or runtime config

---

## Scenario 3: RAG answer quality is poor

Should you immediately lower temperature?

Probably not.

Why?

- bad retrieval quality may be the real root cause
- poor prompt context may be the issue
- grounding and data retrieval matter more than temperature alone
- a small parameter tweak is not a substitute for missing information

---

## Scenario 4: Creative writing output is too repetitive

What parameters could you investigate?

- increase temperature slightly
- increase top-p or top-k
- adjust repetition penalty
- add stronger diversity instructions

---

## Scenario 5: JSON extraction is inconsistent

Should you only change temperature?

No.

Because:

- temperature influences randomness, but it does not guarantee valid schema
- output still needs parse + validation
- using a schema validator like Zod or JSON schema is essential

---

# PART 22 — DAY 6 THEORY CHECKLIST

## FOUNDATION

- [ ] Token generation
- [ ] Probability distribution
- [ ] Decoding
- [ ] Sampling
- [ ] Greedy decoding

## TEMPERATURE

- [ ] Temperature meaning
- [ ] Low temperature
- [ ] High temperature
- [ ] Temperature and probability
- [ ] Temperature limitations

## TOP-K

- [ ] Definition
- [ ] Candidate filtering
- [ ] k=1
- [ ] Larger k
- [ ] Limitations

## TOP-P

- [ ] Definition
- [ ] Nucleus sampling
- [ ] Cumulative probability
- [ ] Dynamic candidate set

## COMPARISON

- [ ] Top-k vs top-p
- [ ] Temperature vs top-k
- [ ] Temperature vs top-p

## CoT

- [ ] Definition
- [ ] Use cases
- [ ] Limitations
- [ ] CoT vs RAG
- [ ] CoT vs tools
- [ ] CoT vs prompt engineering

## PRODUCTION

- [ ] Reproducibility
- [ ] Evaluation
- [ ] Versioning
- [ ] Quality/latency/cost trade-offs
- [ ] Hallucination relationship
- [ ] Structured output relationship
- [ ] Streaming relationship

## INTERVIEW

- [ ] Basic questions
- [ ] Intermediate questions
- [ ] Senior questions
- [ ] System design scenarios

---

# PART 23 — IMPORTANT: NO CODING YET

## CODING COMES AFTER THEORY

This document is intentionally theory-first.

Later, after finishing the concepts, I will implement small experiments such as:

- Temperature experiments
- Top-k experiments
- Top-p experiments
- Same prompt with different settings
- Compare outputs
- Measure token/latency behavior
- Ollama parameter experimentation
- Add parameter configuration to NestJS later

But right now, the goal is not to build. The goal is to understand the underlying mechanics.

---

# PART 24 — FINAL DAY 6 COMPLETION CRITERIA

At the end, I should be able to answer without notes:

- "How does an LLM select the next token?"
- "What does temperature actually do?"
- "Top-k vs top-p?"
- "What is Chain-of-Thought?"
- "Why doesn't CoT guarantee correctness?"
- "Why doesn't temperature solve hallucination?"
- "How are decoding parameters related to streaming?"
- "How would you tune an LLM for a production AI system?"

If I cannot explain these clearly, Day 6 is NOT complete.

---

# TEACHING STYLE SUMMARY

Bangla-এ বুঝানো হবে, কিন্তু important technical terms English-এ রাখা হবে।

Examples:

- "Temperature হলো decoding-এর একটি parameter, যা token probability distribution কতটা sharp বা flat হবে সেটাকে প্রভাবিত করে।"
- "Top-p হলো nucleus sampling-এর একটি form, যেখানে cumulative probability threshold ব্যবহার করে candidate set বেছে নেয়া হয়।"
- "CoT হলো reasoning-oriented prompting pattern; এটা answer correctness-এর guarantee নয়, বরং reasoning structure দেয়ার একটি উপায় মাত্র।"

---

## Why this matters

This Day 6 concept is the foundation of serious AI engineering.

Because later, all of this will matter:

- RAG quality
- Tool calling reliability
- Agent behavior
- structured output validation
- evaluation and tuning
- production monitoring

If I understand generation, decoding, token selection, and reasoning style properly, then the later implementation becomes much more thoughtful and correct.

---

## Final note

Day 6 is the day where AI engineering shifts from “I can call the model” to “I understand how the model chooses output.”

This is a critical step because later:

- RAG will need grounded answers
- tool calling will need structured decisions
- agents will need stable behavior
- evaluation will need reliability checks

And all of that depends on understanding:

- prompt design
- token generation
- decoding parameters
- sampling behavior
- reasoning style
- output control

This is the foundation behind all serious AI engineering work.
