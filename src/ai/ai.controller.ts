import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateRequestDto } from './dto/generate-request.dto';

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
}
