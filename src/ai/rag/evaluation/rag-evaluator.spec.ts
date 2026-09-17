import { evaluateCase, summarizeResults, NO_CONTEXT_ANSWER } from './rag-evaluator';
import type { EvalCase } from './eval-dataset';
import type { AskResponse } from '../rag.service';

const baseCase: EvalCase = {
  id: 'case-1',
  category: 'direct',
  question: 'How many days do I have to request a refund?',
  tenantId: 'eval-tenant',
  expectSufficientContext: true,
  expectedAnswerContains: ['30 days'],
};

const source = (documentId = 'doc-1') => ({
  chunkId: 'chunk-1',
  documentId,
  tenantId: 'eval-tenant',
  similarity: 0.9,
});

describe('evaluateCase', () => {
  it('passes a grounded answer that contains the expected phrase', () => {
    const response: AskResponse = {
      answer: 'You have 30 days to request a refund.',
      sources: [source()],
    };

    const result = evaluateCase(baseCase, response);

    expect(result).toMatchObject({
      relevantContext: true,
      grounded: true,
      hallucination: false,
      answerRelevant: true,
      pass: true,
    });
  });

  it('fails when the answer is missing an expected phrase', () => {
    const response: AskResponse = {
      answer: 'You can request a refund from the billing page.',
      sources: [source()],
    };

    const result = evaluateCase(baseCase, response);

    expect(result.answerRelevant).toBe(false);
    expect(result.pass).toBe(false);
    expect(result.notes[0]).toContain('missing expected phrase');
  });

  it('flags hallucination when the model answers with no retrieved context', () => {
    const noContextCase: EvalCase = {
      id: 'case-2',
      category: 'missing-info',
      question: 'Do you offer international shipping?',
      tenantId: 'eval-tenant',
      expectSufficientContext: false,
    };
    const response: AskResponse = {
      answer: 'Yes, we ship to over 50 countries worldwide.',
      sources: [],
    };

    const result = evaluateCase(noContextCase, response);

    expect(result.hallucination).toBe(true);
    expect(result.grounded).toBe(false);
    expect(result.pass).toBe(false);
  });

  it('passes the no-context fallback as grounded and non-hallucinated', () => {
    const noContextCase: EvalCase = {
      id: 'case-3',
      category: 'missing-info',
      question: 'Do you offer international shipping?',
      tenantId: 'eval-tenant',
      expectSufficientContext: false,
    };
    const response: AskResponse = {
      answer: NO_CONTEXT_ANSWER,
      sources: [],
    };

    const result = evaluateCase(noContextCase, response);

    expect(result.grounded).toBe(true);
    expect(result.hallucination).toBe(false);
    expect(result.pass).toBe(true);
  });

  it('fails when the answer contains a disallowed invented detail', () => {
    const hallucinationTriggerCase: EvalCase = {
      id: 'case-4',
      category: 'hallucination-trigger',
      question: 'What exact refund percentage do you give for used products?',
      tenantId: 'eval-tenant',
      expectSufficientContext: false,
      mustNotContainAny: ['90%'],
    };
    const response: AskResponse = {
      answer: 'Used products receive a 90% refund.',
      sources: [source()],
    };

    const result = evaluateCase(hallucinationTriggerCase, response);

    expect(result.answerRelevant).toBe(false);
    expect(result.pass).toBe(false);
  });

  it('flags missing source traceability for specific-source cases', () => {
    const specificSourceCase: EvalCase = {
      id: 'case-5',
      category: 'specific-source',
      question: 'How fast does support respond?',
      tenantId: 'eval-tenant',
      expectSufficientContext: true,
      expectedSourceTitle: 'Support Contact',
    };
    const response: AskResponse = {
      answer: 'Support responds within 24 hours.',
      sources: [source('doc-refund')],
    };

    const result = evaluateCase(specificSourceCase, response, {
      'doc-refund': 'Refund Policy',
      'doc-support': 'Support Contact',
    });

    expect(result.pass).toBe(false);
    expect(result.notes[0]).toContain('Support Contact');
  });

  it('passes source traceability when the expected title matches a retrieved source', () => {
    const specificSourceCase: EvalCase = {
      id: 'case-6',
      category: 'specific-source',
      question: 'How fast does support respond?',
      tenantId: 'eval-tenant',
      expectSufficientContext: true,
      expectedSourceTitle: 'Support Contact',
    };
    const response: AskResponse = {
      answer: 'Support responds within 24 hours.',
      sources: [source('doc-support')],
    };

    const result = evaluateCase(specificSourceCase, response, {
      'doc-support': 'Support Contact',
    });

    expect(result.pass).toBe(true);
  });
});

describe('summarizeResults', () => {
  it('aggregates pass/fail counts and pass rate', () => {
    const results = [
      evaluateCase(baseCase, {
        answer: 'You have 30 days to request a refund.',
        sources: [source()],
      }),
      evaluateCase(baseCase, {
        answer: 'Contact support for details.',
        sources: [source()],
      }),
    ];

    const summary = summarizeResults(results);

    expect(summary).toEqual({
      total: 2,
      passed: 1,
      failed: 1,
      hallucinations: 0,
      passRate: 50,
    });
  });

  it('returns a zero pass rate for an empty result set', () => {
    expect(summarizeResults([])).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      hallucinations: 0,
      passRate: 0,
    });
  });
});
