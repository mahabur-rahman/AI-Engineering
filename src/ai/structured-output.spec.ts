import {
  FraudAssessmentSchema,
  InvoiceExtractionSchema,
  parseFraudAssessment,
  parseInvoiceExtraction,
  parseJsonObject,
} from './structured-output';

describe('structured output validation', () => {
  it('accepts valid invoice JSON from fenced model output', () => {
    const modelOutput = `
      \`\`\`json
      {
        "invoiceId": "INV-1001",
        "customer": "ABC Ltd",
        "amount": 2500,
        "dueDate": "2026-08-20",
        "status": "overdue"
      }
      \`\`\`
    `;

    expect(parseInvoiceExtraction(modelOutput)).toEqual({
      invoiceId: 'INV-1001',
      customer: 'ABC Ltd',
      amount: 2500,
      dueDate: '2026-08-20',
      status: 'overdue',
    });
  });

  it('rejects values that violate schema rules', () => {
    const invalidInvoice = {
      invoiceId: 'INV-1001',
      customer: 'ABC Ltd',
      amount: -500,
      dueDate: '2026-08-20',
      status: 'banana',
    };

    expect(parseInvoiceExtraction(JSON.stringify(invalidInvoice))).toBeNull();
    expect(InvoiceExtractionSchema.safeParse(invalidInvoice).success).toBe(false);
  });

  it('parses JSON safely instead of trusting raw text', () => {
    const parsed = parseJsonObject('{"isFraud":true,"riskScore":42,"reason":"Suspicious pattern"}');

    expect(parsed).toEqual({
      isFraud: true,
      riskScore: 42,
      reason: 'Suspicious pattern',
    });
  });

  it('rejects fraud scores outside the valid range', () => {
    const raw = JSON.stringify({
      isFraud: true,
      riskScore: 150,
      reason: 'Suspicious pattern',
    });

    expect(parseFraudAssessment(raw)).toBeNull();
    expect(FraudAssessmentSchema.safeParse(JSON.parse(raw)).success).toBe(false);
  });
});
