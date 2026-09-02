import { AiService } from './ai.service';

describe('AiService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('forwards Day 6 decoding parameters to Ollama', async () => {
    const service = new AiService({
      getOrThrow: (key: string) => {
        if (key === 'OLLAMA_BASE_URL') return 'http://localhost:11434';
        if (key === 'OLLAMA_MODEL') return 'llama3.2:3b';
        throw new Error(`Missing ${key}`);
      },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ response: '  generated answer  ' }),
    });

    const result = await service.generate('hello world', {
      temperature: 0.4,
      topP: 0.9,
      topK: 40,
      numPredict: 128,
    });

    expect(result).toBe('generated answer');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"temperature":0.4'),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        body: expect.stringContaining('"top_p":0.9'),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        body: expect.stringContaining('"top_k":40'),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        body: expect.stringContaining('"num_predict":128'),
      }),
    );
  });
});
