const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const PASSWORD = process.env.APP_PASSWORD || 'teste123';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(`${BASE_URL}/`);
});

test('adiciona produto com aspas e acentos sem quebrar a tela', async ({ page }) => {
  const name = `Vestido "Único" & Cia <teste> ${Date.now()}`;
  await page.click('#btn-add-product');
  await page.fill('#new-product-name', name);
  await page.click('#btn-modal-confirm');
  await expect(page.locator('#products-container')).toContainText(name);
});

test('incrementa e decrementa contagem', async ({ page }) => {
  const name = `Produto Playwright ${Date.now()}`;
  await page.click('#btn-add-product');
  await page.fill('#new-product-name', name);
  await page.click('#btn-modal-confirm');
  const card = page.locator(`[data-product="${name}"]`);
  await card.locator('[data-action="increment"]').click();
  await card.locator('[data-action="increment"]').click();
  await expect(card.locator('.font-black span')).toHaveText('2');
  await card.locator('[data-action="decrement"]').click();
  await expect(card.locator('.font-black span')).toHaveText('1');
});

test('favoritar produto', async ({ page }) => {
  const name = `Produto Favorito Teste ${Date.now()}`;
  await page.click('#btn-add-product');
  await page.fill('#new-product-name', name);
  await page.click('#btn-modal-confirm');
  const card = page.locator(`[data-product="${name}"]`);
  await card.locator('[data-action="toggle-fav"]').click();
  await expect(card.locator('[data-action="toggle-fav"]')).toContainText('★');
});

test('zerar dia pede confirmação', async ({ page }) => {
  await page.click('#btn-clear-day');
  await expect(page.locator('#custom-confirm-modal')).toBeVisible();
  await page.click('#btn-confirm-cancel');
  await expect(page.locator('#custom-confirm-modal')).toBeHidden();
});

test('troca de loja e data', async ({ page }) => {
  await page.click('#tab-galpao');
  await expect(page.locator('#main-app-title')).toHaveText('GALPÃO UTILIDADES');
  await page.click('#tab-sinta');
  await expect(page.locator('#main-app-title')).toHaveText('SINTA-SE LINDA');
});

test('modo escuro alterna classe dark no html', async ({ page }) => {
  await page.click('#btn-theme');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.click('#btn-theme');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('viewport de celular renderiza corretamente', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#tab-sinta')).toBeVisible();
  await expect(page.locator('#btn-add-product')).toBeVisible();
});

test('relatório diário abre no iframe de impressão', async ({ page }) => {
  await page.click('#btn-daily-pdf');
  const frame = page.frameLocator('#print-frame');
  await expect(frame.locator('h2')).toHaveText('SINTA-SE LINDA');
  await expect(frame.locator('.total-box')).toContainText('peças');
});
