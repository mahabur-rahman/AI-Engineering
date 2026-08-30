import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import {
  buildFewShotClassificationPrompt,
  buildOneShotClassificationPrompt,
  buildZeroShotClassificationPrompt,
} from './prompts/classification.prompt';
import { buildInvoiceSummaryPrompt } from './prompts/invoice-summary.prompt';
import { buildSupportAgentPrompt } from './prompts/support.prompt';
import { ClassificationExample, InvoiceData } from './prompts/prompt.types';
import {
  FraudAssessmentSchema,
  InvoiceExtractionSchema,
  parseFraudAssessment,
  parseInvoiceExtraction,
} from './structured-output';
import { parseNdjsonBuffer } from './streaming';

@Injectable()
export class AiService {
  private readonly ollamaBaseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.ollamaBaseUrl =
      this.configService.getOrThrow<string>('OLLAMA_BASE_URL');
    this.model = this.configService.getOrThrow<string>('OLLAMA_MODEL');
  }

  async generate(prompt: string): Promise<string> {
    const cleanPrompt = prompt?.trim();

    if (!cleanPrompt) {
      throw new BadRequestException('prompt is required');
    }

    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: cleanPrompt,
        stream: false,
      }),
    }).catch(() => {
      throw new ServiceUnavailableException('Unable to reach Ollama');
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadGatewayException(
        `Ollama returned ${response.status}: ${errorText || response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      response?: string;
    };

    if (typeof data.response !== 'string') {
      throw new BadGatewayException(
        'Ollama response did not contain generated text',
      );
    }

    return data.response.trim();
  }

  async classifyZeroShot(message: string): Promise<string> {
    return this.generate(buildZeroShotClassificationPrompt(message));
  }

  async classifyOneShot(
    message: string,
    example: ClassificationExample,
  ): Promise<string> {
    return this.generate(buildOneShotClassificationPrompt(message, example));
  }

  async classifyFewShot(
    message: string,
    examples: ClassificationExample[],
  ): Promise<string> {
    return this.generate(buildFewShotClassificationPrompt(message, examples));
  }

  async createSupportReply(customerMessage: string): Promise<string> {
    return this.generate(buildSupportAgentPrompt(customerMessage));
  }

  async summarizeInvoice(invoice: InvoiceData): Promise<string> {
    return this.generate(buildInvoiceSummaryPrompt(invoice));
  }

  async extractInvoiceFromText(text: string): Promise<z.infer<typeof InvoiceExtractionSchema>> {
    const cleanText = text?.trim();

    if (!cleanText) {
      throw new BadRequestException('text is required');
    }

    const prompt = `
      You extract invoice data carefully.

      Extract only the invoice fields from the input.

      Do not invent missing values.
      Return only valid JSON.

      <invoice_data>
      ${cleanText}
      </invoice_data>

      Required fields: invoiceId, customer, amount, dueDate, status.
      Allowed status values: draft, sent, paid, overdue, cancelled.
    `;

    const raw = await this.generate(prompt);
    const parsed = parseInvoiceExtraction(raw);

    if (!parsed) {
      throw new BadGatewayException(
        'Model returned malformed or invalid invoice JSON.',
      );
    }

    return parsed;
  }

  async assessFraud(invoiceText: string): Promise<z.infer<typeof FraudAssessmentSchema>> {
    const cleanText = invoiceText?.trim();

    if (!cleanText) {
      throw new BadRequestException('invoiceText is required');
    }

    const prompt = `
      You assess invoice fraud risk carefully.

      Analyze only the provided invoice text.
      Return only valid JSON with keys: isFraud, riskScore, reason.
      isFraud must be boolean.
      riskScore must be an integer between 0 and 100.

      <invoice_text>
      ${cleanText}
      </invoice_text>
    `;

    const raw = await this.generate(prompt);
    const parsed = parseFraudAssessment(raw);

    if (!parsed) {
      throw new BadGatewayException(
        'Model returned malformed or invalid fraud JSON.',
      );
    }

    return parsed;
  }

  async streamPrompt(prompt: string): Promise<string> {
    const cleanPrompt = prompt?.trim();

    if (!cleanPrompt) {
      throw new BadRequestException('prompt is required');
    }

    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: cleanPrompt,
        stream: true,
      }),
    }).catch(() => {
      throw new ServiceUnavailableException('Unable to reach Ollama');
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadGatewayException(
        `Ollama returned ${response.status}: ${errorText || response.statusText}`,
      );
    }

    if (!response.body) {
      throw new BadGatewayException('Ollama stream response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullOutput = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const { lines, remaining } = parseNdjsonBuffer(buffer);
      buffer = remaining;

      for (const line of lines) {
        if (typeof line.response === 'string') {
          fullOutput += line.response;
        }

        if (line.done) {
          return fullOutput;
        }
      }
    }

    return fullOutput;
  }
}
