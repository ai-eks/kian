import { describe, it, expect } from 'vitest';

describe('agentActions', () => {
  it('module placeholder is importable', async () => {
    // After the structured_output removal refactor, parseAgentResponse is no longer needed.
    // This test verifies the module is still importable.
    const mod = await import('../../src/shared/utils/agentActions');
    expect(mod).toBeDefined();
  });
});
