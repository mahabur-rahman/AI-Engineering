// Week 2 Day 7 - RAG Evaluator
// What: Deterministic (non-LLM) scoring of a RAG answer against an eval case
// Why: Fast, repeatable, no extra model call needed for basic evaluation.
//      LLM-as-a-judge is a future upgrade, not required for Day 7 scope.

import type { AskResponse } from '../rag.service';
import type { EvalCase } from './eval-dataset';

export const NO_CONTEXT_ANSWER = 'I do not know based on the provided context.';

export interface EvalResult {
  id: string;
  category: string;
  question: string;
  answer: string;
  retrievedChunks: number;
  relevantContext: boolean;
  grounded: boolean;
  answerRelevant: boolean;
  hallucination: boolean;
  pass: boolean;
  notes: string[];
}

export function evaluateCase(
  evalCase: EvalCase,
  response: AskResponse,
  titleByDocumentId: Record<string, string> = {},
): EvalResult {
  const notes: string[] = [];
  const retrievedChunks = response.sources.length;
  const hasContext = retrievedChunks > 0;
  const isFallbackAnswer = response.answer.trim() === NO_CONTEXT_ANSWER;

  // Context relevance: did retrieval behave the way this case expects?
  const relevantContext = evalCase.expectSufficientContext ? hasContext : true;
  if (evalCase.expectSufficientContext && !hasContext) {
    notes.push(
      'expected retrieval to find supporting context but none was returned',
    );
  }

  // Groundedness: when there is no context, the model must fall back instead
  // of inventing an answer. When context exists, groundedness is checked
  // further below via the hallucination and keyword checks.
  const grounded = hasContext ? true : isFallbackAnswer;
  if (!hasContext && !isFallbackAnswer) {
    notes.push('no context was retrieved but the model still produced an answer');
  }

  // Hallucination: a confident answer with zero supporting context.
  const hallucination = !hasContext && !isFallbackAnswer;

  // Answer relevance: required phrases present, and disallowed invented
  // details absent.
  let answerRelevant = true;

  if (evalCase.expectedAnswerContains?.length) {
    const lowerAnswer = response.answer.toLowerCase();
    const missing = evalCase.expectedAnswerContains.filter(
      (phrase) => !lowerAnswer.includes(phrase.toLowerCase()),
    );
    if (missing.length > 0) {
      answerRelevant = false;
      notes.push(`answer is missing expected phrase(s): ${missing.join(', ')}`);
    }
  }

  if (evalCase.mustNotContainAny?.length) {
    const lowerAnswer = response.answer.toLowerCase();
    const invented = evalCase.mustNotContainAny.filter((phrase) =>
      lowerAnswer.includes(phrase.toLowerCase()),
    );
    if (invented.length > 0) {
      answerRelevant = false;
      notes.push(`answer contains disallowed invented detail(s): ${invented.join(', ')}`);
    }
  }

  // Source traceability: when a specific source is expected, at least one
  // retrieved chunk must map back to that seed document's title.
  let sourceMatch = true;
  if (evalCase.expectedSourceTitle) {
    sourceMatch = response.sources.some(
      (source) => titleByDocumentId[source.documentId] === evalCase.expectedSourceTitle,
    );
    if (!sourceMatch) {
      notes.push(
        `expected a source titled "${evalCase.expectedSourceTitle}" but it was not among retrieved sources`,
      );
    }
  }

  const pass =
    relevantContext && grounded && !hallucination && answerRelevant && sourceMatch;

  return {
    id: evalCase.id,
    category: evalCase.category,
    question: evalCase.question,
    answer: response.answer,
    retrievedChunks,
    relevantContext,
    grounded,
    answerRelevant,
    hallucination,
    pass,
    notes,
  };
}

export interface EvalSummary {
  total: number;
  passed: number;
  failed: number;
  hallucinations: number;
  passRate: number;
}

export function summarizeResults(results: EvalResult[]): EvalSummary {
  const total = results.length;
  const passed = results.filter((result) => result.pass).length;
  const hallucinations = results.filter((result) => result.hallucination).length;

  return {
    total,
    passed,
    failed: total - passed,
    hallucinations,
    passRate: total === 0 ? 0 : Math.round((passed / total) * 1000) / 10,
  };
}
