// Week 2 Day 7 - RAG Evaluation Dataset
// What: A small, self-contained golden dataset (seed documents + questions)
// Why: Evaluation must be repeatable regardless of whatever else is in the
//      database, so it uses its own isolated tenant and known fixture content.

export const EVAL_TENANT_ID = 'eval-tenant';

export interface EvalSeedDocument {
  title: string;
  tenantId: string;
  content: string;
}

export const evalSeedDocuments: EvalSeedDocument[] = [
  {
    title: 'Refund Policy',
    tenantId: EVAL_TENANT_ID,
    content:
      'Customers can request a refund within 30 days of purchase from the billing page. ' +
      'Refund requests are reviewed within five business days by the billing team.',
  },
  {
    title: 'Support Contact',
    tenantId: EVAL_TENANT_ID,
    content:
      'For technical issues, contact support through the help center. ' +
      'Support responses are typically sent within 24 hours on business days.',
  },
];

export type EvalCategory =
  | 'direct'
  | 'multi-chunk'
  | 'irrelevant-retrieval'
  | 'missing-info'
  | 'hallucination-trigger'
  | 'ambiguous'
  | 'specific-source';

export interface EvalCase {
  id: string;
  category: EvalCategory;
  question: string;
  tenantId: string;
  /** Whether retrieval is expected to find useful, sufficient context. */
  expectSufficientContext: boolean;
  /** Phrases the answer must contain (case-insensitive) when it should be grounded. */
  expectedAnswerContains?: string[];
  /** Phrases that would indicate an invented/hallucinated detail. */
  mustNotContainAny?: string[];
  /** Title of the seed document the answer should be traceable to. */
  expectedSourceTitle?: string;
}

export const evalDataset: EvalCase[] = [
  {
    id: 'direct-refund-window',
    category: 'direct',
    question: 'How many days do I have to request a refund?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: true,
    expectedAnswerContains: ['30 days'],
  },
  {
    id: 'multi-chunk-refund-process',
    category: 'multi-chunk',
    question:
      'Where do I request a refund from, and how long does the review take?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: true,
    expectedAnswerContains: ['billing page', 'five business days'],
  },
  {
    id: 'irrelevant-retrieval-parking',
    category: 'irrelevant-retrieval',
    question: 'What is your office parking policy?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: false,
  },
  {
    id: 'missing-info-shipping',
    category: 'missing-info',
    question: 'Do you offer international shipping?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: false,
  },
  {
    id: 'hallucination-refund-percentage',
    category: 'hallucination-trigger',
    question: 'What exact refund percentage do you give for used products?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: false,
    mustNotContainAny: ['100%', '90%', '80%', '50%'],
  },
  {
    id: 'ambiguous-get-help',
    category: 'ambiguous',
    question: 'How do I get help?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: true,
  },
  {
    id: 'specific-source-response-time',
    category: 'specific-source',
    question: 'According to support contact info, how fast do they respond?',
    tenantId: EVAL_TENANT_ID,
    expectSufficientContext: true,
    expectedAnswerContains: ['24 hours'],
    expectedSourceTitle: 'Support Contact',
  },
];
