-- Week 2 Day 2 - PostgreSQL initialization script
-- What: Runs when PostgreSQL container starts
-- Why: Ensures pgvector extension is installed and ready
-- How: Automatically executed by docker-compose

-- =====================================================
-- Step 1: Create pgvector extension
-- =====================================================
-- pgvector is a PostgreSQL extension that adds:
-- - vector data type (for storing embeddings)
-- - similarity operations (<=> for cosine similarity)
-- - HNSW indexing for fast approximate nearest neighbor search

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Step 2: Verify installation
-- =====================================================
-- This creates a simple test to ensure everything works

SELECT version();

-- =====================================================
-- Step 3: Create indexes
-- =====================================================
-- These will be created by Prisma migrations
-- But we can also do it here if needed

-- Note: Actual schema is created by Prisma migrate
-- This file just sets up the extension
