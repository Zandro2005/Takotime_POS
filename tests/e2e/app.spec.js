import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test.describe('TAKOTIME POS App', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should open window and render root element', async () => {
    const title = await window.title();
    expect(title).toBe('TAKOTIME POS');
    
    // Verify a core element like the root div exists
    const rootExists = await window.locator('#root').count();
    expect(rootExists).toBe(1);
  });
});
