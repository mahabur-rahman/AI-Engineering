export type ClassificationLabel = 'billing' | 'technical' | 'account';

export interface ClassificationExample {
  message: string;
  label: ClassificationLabel;
}

export interface InvoiceData {
  customerName?: string;
  status?: string;
  totalAmount?: number;
  dueDate?: string;
}
