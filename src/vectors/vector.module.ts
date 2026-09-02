// Week 2 Day 2 - Vector Module
// What: NestJS module that wires together all vector-related services
// Why: Modules organize and provide dependency injection
// Where used: Imported into AppModule

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorController } from './vector.controller';
import { VectorDbService } from './vector-db.service';
import { EmbeddingService } from './embedding.service';

// =====================================================
// VECTOR MODULE
// =====================================================
// 
// This module provides:
// 1. EmbeddingService - connects to Ollama for embeddings
// 2. VectorDbService - stores/retrieves from PostgreSQL
// 3. VectorController - REST API endpoints
//
// Dependency flow:
// VectorController
//   ├── depends on VectorDbService
//   │   └── depends on EmbeddingService
//   └── depends on EmbeddingService
//
// All depend on ConfigService for environment variables

@Module({
  imports: [ConfigModule], // Needed for environment variables
  controllers: [VectorController],
  providers: [EmbeddingService, VectorDbService],
  exports: [EmbeddingService, VectorDbService], // Export for other modules to use
})
export class VectorModule {}
