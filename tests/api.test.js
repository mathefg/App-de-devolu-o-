const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devolucoes-test-'));
process.env.DATA_DIR = tmpDir;
process.env.APP_PASSWORD = 'senha-teste-123';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { createApp } = require('../server');

const app = createApp();

async function authedAgent() {
  const agent = request.agent(app);
  const res = await agent.post('/login').send({ password: 'senha-teste-123' });
  assert.equal(res.status, 200);
  return agent;
}

test('sem autenticação, API retorna 401', async () => {
  const res = await request(app).get('/api/day?store=sinta&date=2026-01-01');
  assert.equal(res.status, 401);
});

test('login com senha errada falha', async () => {
  const res = await request(app).post('/login').send({ password: 'errada' });
  assert.equal(res.status, 401);
});

test('valida loja e data', async () => {
  const agent = await authedAgent();
  const res1 = await agent.get('/api/day?store=invalida&date=2026-01-01');
  assert.equal(res1.status, 400);

  const res2 = await agent.get('/api/day?store=sinta&date=data-invalida');
  assert.equal(res2.status, 400);
});

test('adiciona produto e incrementa quantidade sem sobrescrever', async () => {
  const agent = await authedAgent();
  const date = '2026-02-10';

  const addRes = await agent.post('/api/products').send({ store: 'sinta', date, product: 'Vestido Floral' });
  assert.equal(addRes.status, 201);

  await agent.post('/api/returns/increment').send({ store: 'sinta', date, product: 'Vestido Floral', delta: 1 });
  await agent.post('/api/returns/increment').send({ store: 'sinta', date, product: 'Vestido Floral', delta: 1 });
  const res = await agent.post('/api/returns/increment').send({ store: 'sinta', date, product: 'Vestido Floral', delta: 1 });
  assert.equal(res.body.quantity, 3);

  const dayRes = await agent.get(`/api/day?store=sinta&date=${date}`);
  assert.equal(dayRes.body.total, 3);
});

test('incremento não fica negativo', async () => {
  const agent = await authedAgent();
  const date = '2026-02-11';
  await agent.post('/api/products').send({ store: 'sinta', date, product: 'Blusa Teste' });
  const res = await agent.post('/api/returns/increment').send({ store: 'sinta', date, product: 'Blusa Teste', delta: -5 });
  assert.equal(res.body.quantity, 0);
});

test('produtos duplicados (case/acento) não são criados duas vezes', async () => {
  const agent = await authedAgent();
  const date = '2026-02-12';
  const r1 = await agent.post('/api/products').send({ store: 'sinta', date, product: 'Vestido Midi' });
  assert.equal(r1.status, 201);
  const r2 = await agent.post('/api/products').send({ store: 'sinta', date, product: '  vestido   midi  ' });
  assert.equal(r2.status, 409);
});

test('incremento concorrente soma corretamente', async () => {
  const agent = await authedAgent();
  const date = '2026-02-13';
  await agent.post('/api/products').send({ store: 'sinta', date, product: 'Camisa Concorrente' });

  const requests = Array.from({ length: 20 }, () =>
    agent.post('/api/returns/increment').send({ store: 'sinta', date, product: 'Camisa Concorrente', delta: 1 })
  );
  await Promise.all(requests);

  const dayRes = await agent.get(`/api/day?store=sinta&date=${date}`);
  const product = dayRes.body.products.find((p) => p.product === 'Camisa Concorrente');
  assert.equal(product.quantity, 20);
});

test('nome com HTML/aspas é tratado como texto simples (sem quebrar JSON)', async () => {
  const agent = await authedAgent();
  const date = '2026-02-14';
  const dangerousName = `<script>alert('x')</script> "quote" 'quote'`;
  const res = await agent.post('/api/products').send({ store: 'sinta', date, product: dangerousName });
  assert.equal(res.status, 201);
  const dayRes = await agent.get(`/api/day?store=sinta&date=${date}`);
  const found = dayRes.body.products.find((p) => p.product.includes('script'));
  assert.ok(found);
});

test('resumo mensal soma apenas o mês correto', async () => {
  const agent = await authedAgent();
  await agent.post('/api/products').send({ store: 'galpao', date: '2026-03-05', product: 'Item Março' });
  await agent.post('/api/returns/increment').send({ store: 'galpao', date: '2026-03-05', product: 'Item Março', delta: 5 });
  await agent.post('/api/products').send({ store: 'galpao', date: '2026-04-05', product: 'Item Abril' });
  await agent.post('/api/returns/increment').send({ store: 'galpao', date: '2026-04-05', product: 'Item Abril', delta: 9 });

  const res = await agent.get('/api/month?store=galpao&month=2026-03');
  assert.equal(res.body.total, 5);
  assert.equal(res.body.days.length, 1);
});

test('importação de dados legados é idempotente (soma sem duplicar)', async () => {
  const agent = await authedAgent();
  const legacyState = {
    favoriteProducts: { sinta: ['Produto Fav'], galpao: [] },
    dailyCustomProducts: { sinta: { '2026-05-01': ['Produto Dia'] }, galpao: {} },
    data: { sinta: { '2026-05-01': { 'Produto Dia': 3 } }, galpao: {} },
  };

  const r1 = await agent.post('/api/import').send(legacyState);
  assert.equal(r1.status, 200);

  const dayRes = await agent.get('/api/day?store=sinta&date=2026-05-01');
  const produtoDia = dayRes.body.products.find((p) => p.product === 'Produto Dia');
  assert.equal(produtoDia.quantity, 3);

  const r2 = await agent.post('/api/import').send(legacyState);
  assert.equal(r2.status, 200);
  const dayRes2 = await agent.get('/api/day?store=sinta&date=2026-05-01');
  const produtoDia2 = dayRes2.body.products.find((p) => p.product === 'Produto Dia');
  assert.equal(produtoDia2.quantity, 6);
});

test('zerar dia remove as quantidades mas mantém produtos cadastrados', async () => {
  const agent = await authedAgent();
  const date = '2026-06-01';
  await agent.post('/api/products').send({ store: 'sinta', date, product: 'Produto Zerar' });
  await agent.post('/api/returns/increment').send({ store: 'sinta', date, product: 'Produto Zerar', delta: 7 });
  await agent.post('/api/day/clear').send({ store: 'sinta', date });

  const dayRes = await agent.get(`/api/day?store=sinta&date=${date}`);
  const found = dayRes.body.products.find((p) => p.product === 'Produto Zerar');
  assert.ok(found);
  assert.equal(found.quantity, 0);
});

test('/api/health não exige autenticação', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
});
