const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const PASSWORD = process.env.APP_PASSWORD || 'teste123';

test('sem sessão, acessar o app redireciona para a tela de login', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.waitForURL(/\/login\.html$/);
  await expect(page.locator('h1')).toContainText('DEVOLUÇÕES TIKTOK');
});

test('senha errada mostra a caixa de erro', async ({ page }) => {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('#password', 'senha-errada-123');
  await page.click('button[type=submit]');
  await expect(page.locator('#login-error')).toBeVisible();
  await expect(page.locator('#login-error')).toHaveText('Senha incorreta.');
});

test('senha certa entra e o app carrega', async ({ page }) => {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(`${BASE_URL}/`);
  await expect(page.locator('#tab-sinta')).toBeVisible();
});

test('botão olho alterna a visibilidade da senha', async ({ page }) => {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('#password', 'algumasenha');
  await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  await page.click('#btn-toggle-password');
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
});

test('logout volta para a tela de login', async ({ page }) => {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(`${BASE_URL}/`);

  await page.click('#btn-logout');
  await page.waitForURL(/\/login\.html$/);

  await page.goto(`${BASE_URL}/`);
  await page.waitForURL(/\/login\.html$/);
});

test('tela de login funciona em viewport de celular (390x844)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/login.html`);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('button[type=submit]')).toBeVisible();
});
