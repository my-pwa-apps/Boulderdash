import { expect, test } from '@playwright/test';

test('progresses through all 16 caves and enters level 17', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('#level')).toContainText('Cave A');

  for (let level = 1; level <= 16; level++) {
    const fixture = await page.evaluate(() => window.__BOULDER_DASH_E2E__.prepareExit());
    expect(fixture.level).toBe(level);

    await page.keyboard.down(fixture.key);
    await page.waitForTimeout(150);
    await page.keyboard.up(fixture.key);
    await expect.poll(
      () => page.evaluate(() => window.__BOULDER_DASH_E2E__.state().level),
      { message: `Cave ${String.fromCharCode(64 + level)} should complete` }
    ).toBe(level + 1);
  }

  await expect(page.locator('#level')).toContainText('Cave Q');
  await expect(page.locator('#level')).toContainText('+1');
  await expect(page.locator('#gameCanvas')).toBeVisible();

  const finalState = await page.evaluate(() => window.__BOULDER_DASH_E2E__.state());
  expect(finalState).toMatchObject({
    level: 17,
    levelComplete: false,
    gameOver: false,
    lives: 3
  });
});