export interface ContextBuildResult<T extends { content: string }> {
  context: string;
  sources: T[];
}

export function buildRetrievedContext<T extends { content: string }>(
  results: T[],
  maxContextChars: number = 6000,
): ContextBuildResult<T> {
  if (maxContextChars <= 0) {
    return { context: '', sources: [] };
  }

  const seenContent = new Set<string>();
  const contextParts: string[] = [];
  const sources: T[] = [];
  let contextLength = 0;

  for (const result of results) {
    const normalizedContent = result.content.trim().replace(/\s+/g, ' ');
    if (!normalizedContent || seenContent.has(normalizedContent)) {
      continue;
    }

    const sourceBlock = `[Source ${sources.length + 1}]\n${normalizedContent}`;
    const separatorLength = contextParts.length > 0 ? 2 : 0;
    if (
      contextLength + separatorLength + sourceBlock.length >
      maxContextChars
    ) {
      continue;
    }

    seenContent.add(normalizedContent);
    contextParts.push(sourceBlock);
    sources.push(result);
    contextLength += separatorLength + sourceBlock.length;
  }

  return {
    context: contextParts.join('\n\n'),
    sources,
  };
}
