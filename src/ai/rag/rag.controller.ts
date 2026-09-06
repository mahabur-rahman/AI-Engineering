import { Body, Controller, Post } from '@nestjs/common';
import { RagService } from './rag.service';
import type { AskRequest, AskResponse } from './rag.service';

@Controller()
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('ask')
  ask(@Body() request: AskRequest): Promise<AskResponse> {
    return this.ragService.ask(request);
  }
}
