import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateRequestDto } from './dto/generate-request.dto';
import type {
  ClassificationExample,
  InvoiceData,
} from './prompts/prompt.types';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generate(
    @Body() body: GenerateRequestDto,
  ): Promise<{ answer: string }> {
    const answer = await this.aiService.generate(body.prompt);
    return { answer };
  }

  @Post('classify/zero-shot')
  async classifyZeroShot(
    @Body('message') message: string,
  ): Promise<{ answer: string }> {
    return { answer: await this.aiService.classifyZeroShot(message) };
  }

  @Post('classify/one-shot')
  async classifyOneShot(
    @Body() body: { message: string; example: ClassificationExample },
  ): Promise<{ answer: string }> {
    return {
      answer: await this.aiService.classifyOneShot(body.message, body.example),
    };
  }

  @Post('classify/few-shot')
  async classifyFewShot(
    @Body() body: { message: string; examples: ClassificationExample[] },
  ): Promise<{ answer: string }> {
    return {
      answer: await this.aiService.classifyFewShot(body.message, body.examples),
    };
  }

  @Post('support/reply')
  async supportReply(
    @Body('customerMessage') customerMessage: string,
  ): Promise<{ answer: string }> {
    return { answer: await this.aiService.createSupportReply(customerMessage) };
  }

  @Post('invoice/summary')
  async invoiceSummary(
    @Body() invoice: InvoiceData,
  ): Promise<{ answer: string }> {
    return { answer: await this.aiService.summarizeInvoice(invoice) };
  }
}
