import { parseNdjsonBuffer } from './streaming';

describe('streaming buffer parser', () => {
  it('collects complete NDJSON lines and keeps partial data buffered', () => {
    const partial = '{"response":"Hel';
    const next = 'lo","done":false}\n{"response":" world","done":true}\n';

    const { lines, remaining } = parseNdjsonBuffer(partial + next);

    expect(lines).toEqual([
      { response: 'Hello', done: false },
      { response: ' world', done: true },
    ]);
    expect(remaining).toBe('');
  });

  it('keeps incomplete trailing chunks for the next parse cycle', () => {
    const { lines, remaining } = parseNdjsonBuffer('{"response":"Hel');

    expect(lines).toEqual([]);
    expect(remaining).toBe('{"response":"Hel');
  });
});
