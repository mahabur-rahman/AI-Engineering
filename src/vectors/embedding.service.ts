// Week 2 Day 2 - Embedding Service
// What: Converts text into numeric vectors using Ollama
// Why: This is how we represent meaning mathematically
// Where used: When ingesting documents and queries

import {
  Injectable,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// =====================================================
// TYPES
// =====================================================

export interface EmbeddingRequest {
  text: string;
  model?: string; // optional override
}

export interface EmbeddingResponse {
  embedding: number[]; // The actual vector
  model: string;
  dimensions: number; // How many numbers in the vector
}

export interface BatchEmbeddingRequest {
  texts: string[];
}

export interface BatchEmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
}

// =====================================================
// EMBEDDING SERVICE
// =====================================================

@Injectable()
export class EmbeddingService {
  private readonly ollamaBaseUrl: string;
  private readonly embeddingModel: string;
  private dimensions: number = 768; // nomic-embed-text output dimension
  private readonly requestTimeoutMs = 30_000;
  private readonly maxAttempts = 3;

  constructor(private readonly configService: ConfigService) {
    // Read from .env:
    // - OLLAMA_BASE_URL: http://localhost:11434
    // - EMBEDDING_MODEL: nomic-embed-text or another embedding model
    this.ollamaBaseUrl =
      this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.embeddingModel =
      this.configService.get('EMBEDDING_MODEL') || 'nomic-embed-text';
  }

  // =====================================================
  // Main method: Generate embedding for one text
  // =====================================================
  // How it works:
  // 1. Validate input
  // 2. Call Ollama embedding endpoint
  // 3. Extract vector from response
  // 4. Return as array of numbers
  //
  // Why separate this from LLM generation?
  // - Embedding model is trained differently
  // - Optimized for representing meaning
  // - Smaller, faster than large LLMs

  async generateEmbedding(
    request: EmbeddingRequest,
  ): Promise<EmbeddingResponse> {
    const { text, model } = request;

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const selectedModel = model || this.embeddingModel;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.ollamaBaseUrl}/api/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            prompt: text,
          }),
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new BadGatewayException(
            `Ollama returned ${response.status}: ${errorText}`,
          );
        }

        const data = (await response.json()) as {
          embedding?: number[];
        };

        if (
          !data.embedding ||
          !Array.isArray(data.embedding) ||
          data.embedding.length !== this.dimensions ||
          !data.embedding.every((value) => Number.isFinite(value))
        ) {
          throw new BadGatewayException('Ollama did not return valid embedding');
        }

        return {
          embedding: data.embedding,
          model: selectedModel,
          dimensions: data.embedding.length,
        };
      } catch (error: unknown) {
        if (error instanceof BadGatewayException || attempt === this.maxAttempts) {
          if (error instanceof BadGatewayException) {
            throw error;
          }
          throw new ServiceUnavailableException(
            `Unable to reach Ollama embedding service: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }

    throw new ServiceUnavailableException('Embedding generation failed');
  }

  // =====================================================
  // Batch method: Generate embeddings for multiple texts
  // =====================================================
  // How it works:
  // - Calls generateEmbedding multiple times
  // - Returns array of embedding vectors
  // - Useful for ingesting whole document at once
  //
  // Performance note:
  // - Sequential in this basic implementation
  // - For production: consider batch API endpoint
  // - Or parallel requests with rate limiting

  async generateBatchEmbeddings(
    request: BatchEmbeddingRequest,
  ): Promise<BatchEmbeddingResponse> {
    const { texts } = request;

    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    // Generate embedding for each text
    // In production, you might batch these more efficiently
    const embeddings: number[][] = [];

    for (const text of texts) {
      const result = await this.generateEmbedding({ text });
      embeddings.push(result.embedding);
    }

    return {
      embeddings,
      model: this.embeddingModel,
      dimensions: embeddings[0]?.length || 0,
    };
  }

  // =====================================================
  // Helper: Check if Ollama is running
  // =====================================================
  // Why: Good for health checks and diagnostics

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // =====================================================
  // Helper: Get list of available embedding models
  // =====================================================
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };

      return (
        data.models
          ?.map((m) => m.name)
          .filter((name) => name.includes('embed')) || []
      );
    } catch {
      return [];
    }
  }

  // =====================================================
  // IMPORTANT: Dimension consistency
  // =====================================================
  // Why this matters:
  // - PostgreSQL pgvector column is fixed size (e.g., vector(1536))
  // - If embedding model returns different dimensions, INSERT fails
  // - Must use same model for all embeddings
  // - If switching models, must recreate embeddings
  //
  // Example problem:
  // - Stored embeddings: 1536 dimensions (nomic-embed-text)
  // - New embedding: 768 dimensions (different model)
  // - Error: dimension mismatch in pgvector

  getDimensions(): number {
    return this.dimensions;
  }

  setDimensions(dimensions: number): void {
    this.dimensions = dimensions;
  }
}
