import {
  buildFewShotClassificationPrompt,
  buildOneShotClassificationPrompt,
  buildZeroShotClassificationPrompt,
  parseClassificationLabel,
} from './classification.prompt';

describe('classification prompts', () => {
  it('builds a zero-shot prompt with constraints and delimiters', () => {
    const prompt = buildZeroShotClassificationPrompt('My invoice is wrong.');

    expect(prompt).toContain('TASK:');
    expect(prompt).toContain('Return exactly one label');
    expect(prompt).toContain(
      '<customer_message>\nMy invoice is wrong.\n</customer_message>',
    );
  });

  it('builds a one-shot prompt with one labelled example', () => {
    const prompt = buildOneShotClassificationPrompt('I was charged twice.', {
      message: 'The website is broken.',
      label: 'technical',
    });

    expect(prompt).toContain('EXAMPLE:');
    expect(prompt).toContain('Label: technical');
    expect(prompt).toContain('I was charged twice.');
  });

  it('builds a few-shot prompt with all labelled examples', () => {
    const prompt = buildFewShotClassificationPrompt('I forgot my password.', [
      { message: 'My invoice is wrong.', label: 'billing' },
      { message: 'The page is broken.', label: 'technical' },
      { message: 'I forgot my password.', label: 'account' },
    ]);

    expect(prompt).toContain('Example 1:');
    expect(prompt).toContain('Example 3:');
    expect(prompt).toContain('Label: account');
  });

  it('parses only the allowed classification labels', () => {
    expect(parseClassificationLabel(' Billing ')).toBe('billing');
    expect(parseClassificationLabel('unknown')).toBeNull();
  });
});
