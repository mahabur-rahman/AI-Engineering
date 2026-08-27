import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
}
