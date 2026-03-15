import { test } from '@playwright/test';

test.describe('kian E2E', () => {
  test('placeholder', async () => {
    test.skip(true, 'Electron E2E bootstrapping to be wired in CI runtime.');
  });
});
