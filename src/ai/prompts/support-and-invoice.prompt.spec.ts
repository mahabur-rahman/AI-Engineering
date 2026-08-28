import {
  buildInvoiceSummaryPrompt,
  parseInvoiceSummary,
} from './invoice-summary.prompt';
import { buildSupportAgentPrompt } from './support.prompt';

describe('support and invoice prompts', () => {
  it('keeps support messages delimited and adds an uncertainty rule', () => {
    const prompt = buildSupportAgentPrompt('My invoice is wrong.');

    expect(prompt).toContain('ROLE:');
    expect(prompt).toContain(
      '<customer_message>\nMy invoice is wrong.\n</customer_message>',
    );
    expect(prompt).toContain('say that you do not know');
  });

  it('builds an invoice JSON output prompt without losing input fields', () => {
    const prompt = buildInvoiceSummaryPrompt({
      customerName: 'Amina',
      totalAmount: 120,
      status: 'overdue',
    });

    expect(prompt).toContain('Return valid JSON');
    expect(prompt).toContain('"customerName":"Amina"');
    expect(prompt).toContain('Use null for missing fields');
  });

  it('accepts only the expected invoice summary shape', () => {
    expect(
      parseInvoiceSummary(
        '{"summary":"Overdue invoice","customerName":"Amina","totalAmount":120,"status":"overdue","dueDate":null,"missingFields":["dueDate"]}',
      ),
    ).toEqual({
      summary: 'Overdue invoice',
      customerName: 'Amina',
      totalAmount: 120,
      status: 'overdue',
      dueDate: null,
      missingFields: ['dueDate'],
    });
    expect(parseInvoiceSummary('not json')).toBeNull();
  });
});
