// Week 2 Day 2 - Document Chunking Utility
// What: Splits large documents into manageable pieces
// Why: LLM context limits + better retrieval granularity
// Where used: When ingesting documents into the vector DB

export interface Chunk {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
}

export function cleanDocumentText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// =====================================================
// CHUNKING STRATEGY 1: Fixed-size chunks with overlap
// =====================================================
// How it works:
// - Splits document into chunks of fixed token size
// - Overlaps consecutive chunks to preserve context
//
// Example:
// Document: "A B C D E F G H I J"
// Chunk size: 3, overlap: 1
// Result: [A B C], [C D E], [E F G], [G H I], [I J]
//
// Why overlap?
// - Prevents losing context at chunk boundaries
// - Improves retrieval when query spans boundaries

export function chunkDocumentFixedSize(
  text: string,
  chunkSize: number = 512, // characters per chunk
  overlap: number = 50, // overlap in characters
): Chunk[] {
  if (!text || text.length === 0 || chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    return [];
  }

  const chunks: Chunk[] = [];
  let startChar = 0;
  let chunkIndex = 0;

  // Step 1: Keep looping until we've processed the whole document
  while (startChar < text.length) {
    // Step 2: Determine where this chunk ends
    let endChar = Math.min(startChar + chunkSize, text.length);

    // Step 3: Try to end at a sentence boundary (better UX)
    // Look for a period, !, or ? within the last 50 chars
    if (endChar < text.length) {
      const sentenceBoundary = text
        .slice(startChar, endChar)
        .search(/[.!?](?=\s|$)/g);
      const lastSentenceEnd =
        sentenceBoundary === -1 ? -1 : startChar + sentenceBoundary;
      // Only use sentence boundary if it's not too far back
      if (lastSentenceEnd > startChar + chunkSize * 0.7) {
        endChar = lastSentenceEnd + 1;
      }
    }

    // Step 4: Create the chunk
    const chunkContent = text.substring(startChar, endChar).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        startChar,
        endChar,
      });
      chunkIndex++;
    }

    // Step 5: Move to next chunk with overlap
    startChar = endChar - overlap;
  }

  return chunks;
}

// =====================================================
// CHUNKING STRATEGY 2: Semantic chunking (paragraph-based)
// =====================================================
// How it works:
// - Respects paragraph/sentence boundaries
// - Keeps semantically related text together
// - More natural than fixed-size chunking
//
// When to use:
// - Documents with clear structure (articles, reports)
// - When paragraph meaning is important

export function chunkDocumentSemantic(
  text: string,
  maxChunkSize: number = 512,
): Chunk[] {
  // Step 1: Split by paragraph (blank lines)
  const paragraphs = text.split(/\n\s*\n/);

  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentStartChar = 0;
  let chunkIndex = 0;
  let charPosition = 0;

  // Step 2: Group paragraphs into chunks
  for (const para of paragraphs) {
    // If adding this paragraph would exceed max size, save current chunk
    if (
      currentChunk.length > 0 &&
      currentChunk.length + para.length > maxChunkSize
    ) {
      const chunkContent = currentChunk.trim();
      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunkIndex,
          startChar: currentStartChar,
          endChar: charPosition,
        });
        chunkIndex++;
      }
      currentChunk = para + '\n\n';
      currentStartChar = charPosition;
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += para;
    }

    charPosition += para.length + 2; // +2 for \n\n
  }

  // Step 3: Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      startChar: currentStartChar,
      endChar: charPosition,
    });
  }

  return chunks;
}

// =====================================================
// CHUNKING STRATEGY 3: Hybrid (mixed size based on content)
// =====================================================
// How it works:
// - Small chunks for code/structured content
// - Larger chunks for prose
// - Detects content type automatically

export function chunkDocumentHybrid(
  text: string,
  minChunkSize: number = 256,
  maxChunkSize: number = 1024,
): Chunk[] {
  // Check if this looks like code (contains common code patterns)
  const isCode = /(?:function|class|def|const|let|var|import|export)\b/i.test(
    text,
  );

  // Use smaller chunks for code, larger for prose
  const chunkSize = isCode ? minChunkSize : maxChunkSize;
  const overlap = Math.floor(chunkSize * 0.1); // 10% overlap

  return chunkDocumentFixedSize(text, chunkSize, overlap);
}

// =====================================================
// VALIDATION: Ensure chunks are reasonable
// =====================================================
export interface ChunkValidationResult {
  isValid: boolean;
  issues: string[];
}

export function validateChunks(chunks: Chunk[]): ChunkValidationResult {
  const issues: string[] = [];
  const seen = new Set<string>();

  if (chunks.length === 0) {
    issues.push('No chunks generated');
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Check if chunk is too small (less than 20 chars is probably noise)
    if (chunk.content.length < 20) {
      issues.push(`Chunk ${i}: too small (${chunk.content.length} chars)`);
    }

    if (seen.has(chunk.content)) {
      issues.push(`Chunk ${i}: duplicate content`);
    }
    seen.add(chunk.content);

    if (chunk.startChar < 0 || chunk.endChar <= chunk.startChar) {
      issues.push(`Chunk ${i}: invalid character offsets`);
    }

    // Check for excessive whitespace
    if (chunk.content.trim().length < chunk.content.length * 0.8) {
      issues.push(`Chunk ${i}: contains excessive whitespace`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// =====================================================
// RECOMMENDED: Use this function for most documents
// =====================================================
export function smartChunkDocument(text: string): Chunk[] {
  const cleanedText = cleanDocumentText(text);
  if (!cleanedText) {
    return [];
  }

  // Step 1: Try semantic first (respects structure)
  const semanticChunks = chunkDocumentSemantic(cleanedText);

  // Step 2: Validate
  const validation = validateChunks(semanticChunks);

  if (validation.isValid) {
    return semanticChunks;
  }

  // Step 3: Fall back to fixed-size if semantic fails
  console.warn('Semantic chunking had issues, falling back to fixed-size');
  return chunkDocumentFixedSize(cleanedText);
}
