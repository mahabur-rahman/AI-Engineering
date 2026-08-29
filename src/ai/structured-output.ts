import { z } from 'zod';

export const InvoiceExtractionSchema = z.object({
  invoiceId: z.string().trim().min(1),
  customer: z.string().trim().min(1),
  amount: z.number().nonnegative(),
  dueDate: z.string().trim().min(1),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
});

export const FraudAssessmentSchema = z.object({
  isFraud: z.boolean(),
  riskScore: z.number().min(0).max(100),
  reason: z.string().trim().min(1),
});

export function parseJsonObject<T>(raw: string): T | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;
export type FraudAssessment = z.infer<typeof FraudAssessmentSchema>;

export function parseInvoiceExtraction(raw: string): InvoiceExtraction | null {
  const parsed = parseJsonObject<unknown>(raw);
  if (!parsed) {
    return null;
  }

  const result = InvoiceExtractionSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function parseFraudAssessment(raw: string): FraudAssessment | null {
  const parsed = parseJsonObject<unknown>(raw);
  if (!parsed) {
    return null;
  }

  const result = FraudAssessmentSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
