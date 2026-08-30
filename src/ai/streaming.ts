import { z } from 'zod';

export type StreamChunk = {
  model?: string;
  created_at?: number;
  response?: string;
  done?: boolean;
  context?: number[];
  error?: string;
};

export function parseNdjsonBuffer(raw: string): {
  lines: StreamChunk[];
  remaining: string;
} {
  const lines = raw.split('\n');
  const completeLines = lines.slice(0, -1);
  const remaining = lines[lines.length - 1] ?? '';

  const parsedLines: StreamChunk[] = [];

  for (const line of completeLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed) as StreamChunk;
      parsedLines.push(parsed);
    } catch {
      // Ignore malformed partial lines and keep them for later repair logic.
    }
  }

  return { lines: parsedLines, remaining };
}

export const StreamPromptSchema = z.object({
  prompt: z.string().trim().min(1),
});

export type StreamPromptInput = z.infer<typeof StreamPromptSchema>;
