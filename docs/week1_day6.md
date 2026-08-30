# Week 1 - Day 6

## CoT + Model Parameters + Prompt Tuning

আজকের লক্ষ্য: LLM-এর reasoning style, output control, temperature/top_p/top_k, stop sequences, max tokens, repetition penalties, এবং prompt tuning-এর basics বুঝে ফেলা।

## Context

- Environment: Ubuntu, 8GB RAM
- Budget: $0
- Model: Ollama local, `llama3.2:3b`
- Stack: NestJS + TypeScript + local Ollama
- Previous milestone: Week 1 Day 5 streaming complete
- Today’s goal: understand how prompt style and generation parameters change model behavior, and how to evaluate them in a controlled way

## Day 6 working rules

- একবারে একটা variable বদলাও: prompt wording, temperature, top_p, max_tokens, stop sequence
- output compare করো systematically
- model outputকে blindly “good” বা “bad” ভাবো না; predefined criteria ব্যবহার করো
- শুধু local/free tools ব্যবহার করো
- Day 6-এর focus হলো reasoning style + parameter tuning, not yet RAG/agents
- production-minded thinking রাখো, কিন্তু local learning scope ঠিক রাখো

---

# PART 1 — LEARNING OBJECTIVES

## 1. Day 6-এ কি শিখতে হবে?

By the end of Day 6, I should be able to understand and explain:

- Chain-of-Thought (CoT) prompting কী
- Why CoT is useful and why it can also be misleading
- Why reasoning and answer quality are not same thing
- Temperature কী
- Top-p কী
- Top-k কী
- Max tokens কী
- Stop sequence কী
- Repetition penalty কী
- Prompt wording কীভাবে model output change করে
- Why the same question can produce different answers under different parameters
- Why parameter tuning is not magic; it is control over output distribution
- How to test prompt/parameter changes systematically
- How to build a small prompt tuning checklist

---

## 2. Chain-of-Thought (CoT) কী?

CoT বলতে model-কে reasoning step-by-step করতে বলা।

Example prompt:

```text
Solve this step by step.
First explain the logic.
Then give the final answer.
```

This is different from simply asking:

```text
Give me the answer.
```

Why?

- model may produce a cleaner internal reasoning flow
- but the reasoning can also be verbose, wrong, or overconfident
- many times the final answer is more reliable when the model is forced or encouraged to reason carefully

Important: CoT is not guaranteed to be truthful reasoning. It is a prompting pattern, not a proof of actual internal logic.

---

## 3. Why CoT matters for local LLMs

Local models like `llama3.2:3b` are smaller than frontier models. That means:

- they are more sensitive to prompt clarity
- they often benefit from explicit reasoning instruction
- they can generate inconsistent answers without good constraints

So Day 6 teaches us how to manage that sensitivity.

---

## 4. Why reasoning and answer quality are different

A model may show a neat reasoning chain, but still produce a wrong final answer.

Need to distinguish:

- reasoning quality
- answer correctness
- format compliance
- hallucination risk
- confidence calibration

This is a big AI engineering skill: we do not trust a long response just because it sounds logical.

---

# PART 2 — MODEL PARAMETERS

## 1. Temperature কী?

Temperature controls randomness in token selection.

### Low temperature

- more deterministic
- more repetitive or conservative
- answers look safer and narrower

Example:

```text
temperature: 0.1
```

Use when:

- classification
- structured output
- extraction
- deterministic business logic

### High temperature

- more creative
- more varied
- more risky
- more hallucination opportunity

Example:

```text
temperature: 0.9
```

Use when:

- brainstorming
- creative writing
- idea generation

### Simple mental model

Temperature = how much the model is allowed to “be creative” instead of “pick the safest next token.”

---

## 2. Top-p (nucleus sampling)

Top-p controls how many token options the model considers before choosing the next token.

- low top-p = model chooses from a small, likely set
- high top-p = model can consider a broader set

This works together with temperature.

Example:

```text
temperature: 0.7, top_p: 0.9
```

Interpretation:

- choose from likely tokens only, but not too narrow
- more diversity than very low temp + low top_p

---

## 3. Top-k

Top-k limits the sampling to the top k most likely next tokens.

- low top_k = narrower output
- high top_k = more diversity

This is more direct than top-p and easier to explain conceptually.

Important: in many local LLM setups, top-k and top-p are both used together, and the best combination depends on the task.

---

## 4. Max tokens

This tells the model how long the answer can be.

- too low => truncated answer
- too high => long, rambling output
- useful for controlling cost and latency

For local or constrained environment, this matters a lot.

---

## 5. Stop sequence

Stop sequence tells the model when to stop generating.

Example:

```text
stop: ["\n\n", "END"]
```

This is valuable for:

- limiting output to one section
- stopping before extra prose
- structured output guardrail

You want the model to stop when output is complete or when the answer format is done.

---

## 6. Repetition penalty

This reduces repeated tokens and repeated phrases.

Useful when:

- model loops
- answer repeats itself
- output becomes stale or redundant

Example:

```text
repeat_penalty: 1.1
```

This is especially helpful in local models that tend to repeat patterns.

---

## 7. Context length / prompt size awareness

Model has limited context window. If your prompt is too long, it may:

- ignore some parts
- forget earlier instructions
- degrade output quality

This matters in production and in local learning. We need to keep prompts short and purposeful.

---

# PART 3 — PROMPT TUNING AND OUTPUT QUALITY

## 1. Prompt wording changes behavior

Same task, different wording can yield different output quality.

Example A:

```text
Classify this support message.
```

Example B:

```text
Classify this support message as one of: billing, technical, or account.
Return only the label and nothing else.
```

Example C:

```text
You are a careful support classifier.
Return only one label from: billing, technical, account.
If uncertain, choose the most likely label.
```

These produce different levels of reliability and clarity.

---

## 2. Role prompting

Role prompts help set expectations.

```text
You are a careful invoice support assistant.
```

This can improve tone and classification but does not guarantee correctness. Role prompt alone is not enough.

---

## 3. Constraints are powerful

Strong constraints help a lot:

- return only JSON
- return only label
- avoid extra prose
- do not invent missing data
- output in this exact format

These are crucial for local LLM reliability.

---

## 4. Prompt structure matters

Good prompt structure usually includes:

- ROLE
- TASK
- CONTEXT
- CONSTRAINTS
- INPUT
- OUTPUT FORMAT
- FAILURE / UNCERTAINTY RULE

This helps the model focus on the right output contract.

---

# PART 4 — HOW TO TEST PARAMETER CHANGES

## 1. Test one variable at a time

This is essential.

Example tests:

- Prompt A vs Prompt B at same temperature
- Temperature 0.2 vs 0.8 with same prompt
- top_p 0.8 vs 0.95
- same prompt with and without stop sequence

If you change multiple variables at once, you cannot know what caused the difference.

---

## 2. Use a fixed test input

Examples:

- invoice message
- support complaint
- extraction task
- JSON formatting task

Same input, same prompt, only parameter changes.

---

## 3. Track quality criteria

Create evaluation criteria such as:

- output is valid JSON
- correct label produced
- answer is not too verbose
- no fabricated values
- output format is exactly correct

This is the beginning of AI evaluation practice.

---

## 4. Measure not just output but also latency

In local LLM work, the same prompt with different settings can change:

- generation time
- output length
- repetition frequency
- variance of response

This is important for local constrained environments.

---

# PART 5 — PRACTICAL EXAMPLES

## Example 1: Same task, different prompt wording

Task:

```text
Classify this support message as billing, technical, or account.
Message: My invoice amount looks wrong.
```

Prompt A:

```text
Classify this message.
```

Prompt B:

```text
Classify this support message as one of: billing, technical, or account.
Return only the label.
```

Prompt C:

```text
You are a careful support classifier.
Classify the message as billing, technical, or account.
Return only one label and nothing else.
```

Compare:

- label correctness
- output format
- whether extra explanation appears

---

## Example 2: Temperature effect

Prompt:

```text
Write a short invoice reminder message.
```

Run with:

- temperature 0.1
- temperature 0.7
- temperature 1.2

Observe:

- repetition
- creativity
- compliance with short format
- risk of strange phrasing

---

## Example 3: Structured output with constraints

Prompt:

```text
Return only valid JSON with keys: invoiceId, customer, amount, dueDate, status.
Do not include any extra text.
```

This is a classic use case where constrained output and low temperature help a lot.

---

# PART 6 — CHAIN-OF-THOUGHT: USEFUL OR DANGEROUS?

## When CoT is useful

- when problem is multi-step
- when model needs a structured reasoning flow
- when you ask for explanation before final answer
- when you want a better reasoning trace for debugging

## When CoT is risky

- when model generates verbose but incorrect reasoning
- when the final answer is wrong despite plausible explanation
- when the explanation is longer than necessary
- when model becomes overconfident or produces fabricated steps

### Senior lesson

Do not treat a long reasoning trace as proof of correctness. It is useful for debugging, but not a truth guarantee.

---

# PART 7 — OLLAMA PARAMETER TESTING

## 1. Example request with custom params

```bash
curl --max-time 60 -sS http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Classify this message as billing, technical, or account: My invoice amount is wrong.",
    "stream": false,
    "options": {
      "temperature": 0.2,
      "top_p": 0.9,
      "top_k": 40,
      "num_predict": 50
    }
  }'
```

---

## 2. Compare outputs with multiple settings

Run the same prompt under:

- temperature 0.1, top_p 0.8
- temperature 0.7, top_p 0.9
- temperature 1.1, top_p 0.95

Observe:

- output length changes
- consistency changes
- creativity changes
- structure changes

---

## 3. What to look for

- output format compliance
- answer repetition
- too-long output
- missing required label
- weird random phrasing

---

# PART 8 — CODING EXERCISES

## Exercise 1: Compare prompts

Objective:

- Understand prompt wording effect

What to implement:

- same input, different prompt wording
- compare output

Expected behavior:

- one prompt produces cleaner output than another

Common mistakes:

- changing multiple variables at once
- not recording exact prompt text

---

## Exercise 2: Compare temperature values

Objective:

- Understand randomness vs determinism

What to implement:

- run same prompt at 0.1, 0.7, 1.2

Expected behavior:

- lower temp = more deterministic
- higher temp = more varied

---

## Exercise 3: Add stop sequence for short output

Objective:

- Stop generation before extra prose

What to implement:

- use stop token or stop sequence

Expected behavior:

- output ends when required format is complete

---

## Exercise 4: Test max tokens

Objective:

- See truncation behavior

What to implement:

- set small max_tokens
- run long prompt

Expected behavior:

- output truncates or stops early

---

## Exercise 5: Evaluate a classification prompt

Objective:

- Build a basic prompt tuning workflow

What to implement:

- fixed test set
- score outputs
- compare different prompts

Expected behavior:

- clear insight into which version is stronger

---

# PART 9 — COMMON MISTAKES

- changing prompt and parameters together without controlling variables
- assuming higher temperature always means “better”
- assuming a long explanation means better reasoning
- forgetting to constrain output format
- ignoring stop sequences
- ignoring max token limits
- using same prompt for all tasks without adapting to task type
- forgetting local model limitations
- not recording comparison results

---

# PART 10 — SENIOR ENGINEER INTERVIEW PREPARATION

## Question 1: What is temperature?

Short answer:

Temperature controls randomness in token selection.

Senior answer:

It affects the distribution from which the next token is sampled. Lower values make the output more deterministic and conservative; higher values increase creativity and variance, which can improve exploration but also increase hallucination risk.

---

## Question 2: What is top-p?

Short answer:

It is nucleus sampling. It limits output to a subset of high-probability tokens.

Senior answer:

It prevents the model from sampling very unlikely tokens. It shapes output diversity in combination with temperature and is often tuned to trade off creativity vs stability.

---

## Question 3: What is the difference between temperature and top-p?

- temperature changes the sharpness of the probability distribution
- top-p changes which tokens are eligible to be sampled

They interact, and you often tune both together.

---

## Question 4: Why do we use stop sequences?

To prevent the model from continuing after the required answer. This is especially important for structured output and short-form responses.

---

## Question 5: Why is CoT useful but not perfect?

Because it often improves reasoning flow, but it can also produce plausible-sounding but wrong reasoning. It is a prompting strategy, not a guarantee of correctness.

---

## Question 6: Why is prompt tuning important?

Because model behavior changes strongly based on wording, structure, and constraints, even when the task is the same.

---

# PART 11 — FLAGSHIP PROJECT INTEGRATION

Day 6 connects to AI Business Copilot in a practical way:

- invoice classification prompt tuning
- support reply generation tuning
- risk/alert message generation
- structured JSON output control
- adjusting temperature for actions like classification vs creative drafting

This is the transition from “basic prompt works” to “business application needs reliable output.”

---

# PART 12 — DAY 6 CHECKLIST

## Theory

- [ ] I can explain CoT clearly
- [ ] I know what temperature does
- [ ] I know what top-p does
- [ ] I know what top-k does
- [ ] I know what max tokens does
- [ ] I know what stop sequences do
- [ ] I know what repetition penalty does
- [ ] I understand prompt tuning basics

## Hands-on

- [ ] I ran the same prompt with different temperatures
- [ ] I compared outputs
- [ ] I tested a structured output prompt with constraints
- [ ] I saw how output length changes with max tokens
- [ ] I tested a stop sequence
- [ ] I recorded the effect of prompt wording changes

## Code

- [ ] I can call Ollama with parameters
- [ ] I can compare outputs between settings
- [ ] I can build a small prompt evaluation script

## Interview

- [ ] I can explain temperature vs top-p
- [ ] I can explain CoT and limitations
- [ ] I can explain why output quality is not just prompt wording

---

# DAY 6 COMPLETION CRITERIA

I should not consider Day 6 complete until I can:

- explain CoT in plain English
- explain temperature, top-p, top-k, max tokens, stop sequences
- compare outputs across parameter changes
- explain why prompt wording changes model behavior
- test at least one prompt under multiple settings
- understand why reasoning quality is not the same as answer correctness
- connect these concepts to the AI Business Copilot use cases

---

# IF I GET STUCK

Rules:

1. Spend max 30 minutes on one issue.
2. Change only one variable at a time.
3. Write down exactly what changed.
4. Compare outputs by predefined criteria.
5. If stuck, return to the simplest baseline prompt.
6. Do not change multiple parameters at once.

---

## Final note

Day 6 is about control.

By now you understand that model output is not random magic. It is a function of:

- prompt wording
- constraints
- instructions
- temperature
- top-p / top-k
- max tokens
- stop sequences
- repetition penalties

This is the first big step from “I can call the model” to “I can tune the model for real business reliability.”
