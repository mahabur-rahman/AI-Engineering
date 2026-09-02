# Week 2 Day 2 - Embeddings + Vector Database Implementation

## Overview

This is the **complete coding implementation** of Week 2 Day 1 concepts: embeddings, vector similarity, PostgreSQL + pgvector, and semantic search.

---

## File Structure & Purpose

### 1. **prisma/schema.prisma**

**What:** Database schema definition  
**Why:** Defines tables for storing documents, chunks, and embeddings  
**Key components:**
- `DocumentChunk`: Stores text chunks + their embeddings
- `Document`: Parent document metadata
- `SearchQuery`: Logs user searches (optional analytics)

**Key concept:**
- `embedding vector(1536)`: Stores 1536-dimensional vectors from Ollama embedding model
- Indexed with `type: Gin` for fast pgvector similarity search

---

### 2. **src/vectors/chunking.util.ts**

**What:** Utility functions to split documents into chunks  
**Why:** Documents are too large to embed as one piece

**Functions:**
- `chunkDocumentFixedSize()`: Splits by character count with overlap
- `chunkDocumentSemantic()`: Respects paragraph/sentence boundaries
- `chunkDocumentHybrid()`: Auto-detects content type (code vs prose)
- `smartChunkDocument()`: Recommended main function

**How it works:**
```
Large Document (10,000 chars)
    ↓
Chunking with overlap
    ↓
Chunks: [chunk1, chunk2, chunk3, ...]
```

**Why overlap?**
- Prevents losing context at chunk boundaries
- Query spanning two chunks still finds relevant content

---

### 3. **src/vectors/embedding.service.ts**

**What:** Service that calls Ollama to generate embeddings  
**Why:** Converts text into numeric vectors for similarity search

**Main methods:**
- `generateEmbedding(text)`: Convert single text to vector
- `generateBatchEmbeddings(texts)`: Convert multiple texts
- `checkHealth()`: Verify Ollama is running

**How it works:**
```
Text: "I need help with my invoice"
    ↓
Call Ollama /api/embeddings endpoint
    ↓
Vector: [0.12, -0.34, 0.76, ..., 0.04]  (1536 dimensions)
```

**Important:**
- Must use same model for ingestion and querying
- Dimension mismatch will fail pgvector INSERT

---

### 4. **src/vectors/vector-db.service.ts**

**What:** Service that stores embeddings in PostgreSQL + pgvector  
**Why:** Persistent storage with semantic search capability

**Main methods:**
- `storeChunk(content, embedding)`: Store single chunk
- `storeDocument(title, chunks)`: Store entire document with all chunks
- `semanticSearch(query, topK)`: Find similar chunks using cosine similarity
- `deleteDocumentChunks(docId)`: Remove old version when updating
- `getStats()`: Monitor chunks and documents stored

**How semantic search works:**
```
User Query: "How do I reset my password?"
    ↓
Generate embedding for query
    ↓
Use PostgreSQL <=> operator (cosine similarity)
    ↓
Find closest stored vectors
    ↓
Return top-K chunks with similarity scores
```

**Why cosine similarity?**
- Measures angle between vectors
- Not affected by vector magnitude
- Better for text embedding comparisons

---

### 5. **src/vectors/vector.controller.ts**

**What:** REST API endpoints for vector operations  
**Why:** Expose functionality via HTTP

**Endpoints:**

#### POST `/vectors/ingest`
```json
{
  "title": "Customer Support FAQ",
  "content": "Q: How do I reset my password?\nA: Click forgot password...",
  "source": "https://help.example.com"
}
```
Response:
```json
{
  "documentId": "doc-abc123",
  "chunkCount": 12,
  "message": "Document ingested successfully with 12 chunks"
}
```

#### POST `/vectors/search`
```json
{
  "query": "How do I reset my password?",
  "topK": 5
}
```
Response:
```json
{
  "query": "How do I reset my password?",
  "results": [
    {
      "id": "chunk-1",
      "content": "To reset password: click forgot password on login...",
      "similarity": 0.92,
      "sourceDocumentId": "doc-abc123"
    }
  ],
  "totalResults": 5
}
```

#### GET `/vectors/health`
- Checks if Ollama is running
- Returns chunk/document counts

#### GET `/vectors/stats`
- Shows total chunks and documents

---

### 6. **src/vectors/vector.module.ts**

**What:** NestJS module  
**Why:** Wires dependencies together and provides dependency injection

**Exports:**
- `EmbeddingService`
- `VectorDbService`

**Used by:**
- `VectorController`
- Any other modules needing vector functionality

---

### 7. **docker-compose.yml**

**What:** Docker Compose configuration  
**Why:** Runs PostgreSQL with pgvector extension

**Services:**
- `postgres`: PostgreSQL 16 with pgvector pre-installed
- `pgadmin`: Web UI for database management (optional)

**How to use:**
```bash
# Start PostgreSQL
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f postgres
```

**Connection details:**
```
Host: localhost
Port: 5432
User: postgres
Password: postgres_password  (change in production!)
Database: ai_engineering
```

---

### 8. **init-db.sql**

**What:** SQL initialization script  
**Why:** Automatically enables pgvector extension when PostgreSQL starts

**What it does:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 9. **.env.example**

**What:** Example environment variables  
**Why:** Shows what configuration is needed

**Updated with:**
```
DATABASE_URL=postgresql://postgres:postgres_password@localhost:5432/ai_engineering
EMBEDDING_MODEL=nomic-embed-text
```

---

## Setup Instructions

### Step 1: Start PostgreSQL with pgvector
```bash
docker-compose up -d

# Verify it's running
docker ps
```

### Step 2: Create database schema
```bash
# Initialize Prisma schema
npx prisma db push

# Verify tables created
docker-compose exec postgres psql -U postgres -d ai_engineering -c "\dt"
```

### Step 3: Start Ollama (separate terminal)
```bash
ollama serve
```

### Step 4: Pull embedding model
```bash
ollama pull nomic-embed-text

# Verify
curl http://localhost:11434/api/tags
```

### Step 5: Start the application
```bash
npm run start:dev
```

### Step 6: Test health check
```bash
curl http://localhost:3000/vectors/health

# Response should show:
{
  "ollamaRunning": true,
  "totalChunks": 0,
  "totalDocuments": 0,
  "status": "healthy"
}
```

### Step 7: Ingest a document
```bash
curl -X POST http://localhost:3000/vectors/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "content": "This is a test document. It contains information about various topics. For example, customers often ask about billing, technical support, or account issues. Each of these is a different category."
  }'

# Response:
{
  "documentId": "xxx",
  "chunkCount": 2,
  "message": "Document ingested successfully with 2 chunks"
}
```

### Step 8: Search
```bash
curl -X POST http://localhost:3000/vectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I get help with payment?",
    "topK": 5
  }'

# Response includes relevant chunks with similarity scores
```

---

## How It Works End-to-End

### Ingestion Pipeline
```
Client POST /vectors/ingest
    ↓
Controller receives document
    ↓
Chunking: Split into 512-char chunks with overlap
    ↓
Embedding: For each chunk, call Ollama /api/embeddings
    ↓
Vector DB: Store chunk + embedding in PostgreSQL
    ↓
pgvector: Automatically build HNSW index for fast search
    ↓
Response: Return document ID + chunk count
```

### Search Pipeline
```
Client POST /vectors/search { query }
    ↓
Controller receives query
    ↓
Embedding: Convert query to vector via Ollama
    ↓
Similarity Search: PostgreSQL <=> (cosine similarity)
    ↓
Top-K: Get 5 closest chunks (highest similarity scores)
    ↓
Return: Chunks + similarity scores
    ↓
Future: Pass to LLM for answer generation (RAG)
```

---

## Key Technologies Used

### PostgreSQL + pgvector
- **Why PostgreSQL?** Already in existing stack
- **Why pgvector?** Native vector support without separate service
- **What it provides?** Vector data type, similarity operators, HNSW indexing

### Ollama
- **Why Ollama?** Local, free, no API costs
- **Which model?** `nomic-embed-text` (1536 dimensions, good quality)

### NestJS
- **Why?** Existing framework in the stack
- **Advantage?** Type-safe services, dependency injection, clean API

### Prisma
- **Why?** Type-safe database access
- **Note:** Prisma doesn't fully support pgvector yet, so we use raw SQL queries

---

## Common Issues & Solutions

### Issue: "Embedding dimension mismatch"
**Cause:** Different embedding models or schema dimension doesn't match  
**Solution:**
```bash
# 1. Check schema dimension (should be 1536)
# 2. Verify embedding model is same: nomic-embed-text
# 3. Recreate embeddings if you changed model
```

### Issue: "Ollama is not running"
**Cause:** Ollama service not started  
**Solution:**
```bash
# In separate terminal
ollama serve

# Then pull model
ollama pull nomic-embed-text
```

### Issue: "Cannot connect to database"
**Cause:** PostgreSQL not running  
**Solution:**
```bash
docker-compose up -d
docker-compose logs postgres
```

### Issue: "pgvector extension not found"
**Cause:** PostgreSQL doesn't have pgvector  
**Solution:**
```bash
# Use the correct image in docker-compose:
image: pgvector/pgvector:pg16
```

---

## What Each File Does (Summary)

| File | Purpose | Key Function |
|------|---------|--------------|
| `prisma/schema.prisma` | Database schema | Defines tables for chunks/embeddings |
| `chunking.util.ts` | Split documents | Converts large text to chunks |
| `embedding.service.ts` | Vector generation | Calls Ollama to create embeddings |
| `vector-db.service.ts` | Storage & search | Stores vectors, performs similarity search |
| `vector.controller.ts` | REST API | Exposes `/vectors/*` endpoints |
| `vector.module.ts` | Module wiring | Dependency injection setup |
| `docker-compose.yml` | Database runtime | PostgreSQL with pgvector |
| `.env.example` | Configuration | Environment variable template |

---

## Next Steps (Week 2 Day 3+)

- Hybrid search (vector + keyword)
- Reranking results
- Advanced chunking strategies
- RAG: Use retrieved chunks as context for LLM answers
- Prompt engineering for RAG
- Evaluation metrics for retrieval quality

---

## Important Concepts

### Vector Space
- Embeddings place similar meanings near each other
- Distance/similarity measured mathematically
- Same model required for consistency

### Cosine Similarity
- Formula: (A · B) / (||A|| * ||B||)
- Returns -1 to 1 (usually 0-1 for semantic)
- Higher = more similar

### HNSW Index
- Hierarchical Navigable Small World
- Approximate Nearest Neighbor algorithm
- Fast search in high-dimensional spaces

### Chunking Tradeoff
- Smaller chunks: More precise retrieval, more overlap
- Larger chunks: Less storage, risks missing context

---

## Quick Commands Reference

```bash
# Start all services
docker-compose up -d
ollama serve  # in another terminal

# Initialize database
npx prisma db push

# Pull embedding model
ollama pull nomic-embed-text

# Start app
npm run start:dev

# Test embedding service
curl http://localhost:11434/api/tags

# Ingest document
curl -X POST http://localhost:3000/vectors/ingest \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"..."}'

# Search
curl -X POST http://localhost:3000/vectors/search \
  -H "Content-Type: application/json" \
  -d '{"query":"your query","topK":5}'

# Health check
curl http://localhost:3000/vectors/health

# View database
docker-compose exec postgres psql -U postgres -d ai_engineering

# Stop services
docker-compose down
```

---

## Final Notes

✅ This implementation covers Week 2 Day 2 completely:
- Embeddings
- Vector similarity
- PostgreSQL + pgvector
- Semantic search
- Top-K retrieval

🚀 Ready for Week 2 Day 3: Hybrid search, reranking, and RAG integration
