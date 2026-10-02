require('dotenv').config();

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const repo = require('./src/repository');
const {
  isValidStore,
  isValidDate,
  isValidProductName,
  isValidQuantity,
  normalizeProductName,
  todayLocalISODate,
} = require('./src/util');
const { requireAuth, login } = require('./src/auth');

const PORT = process.env.PORT || 3001;
const APP_PASSWORD = process.env.APP_PASSWORD;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!APP_PASSWORD && NODE_ENV !== 'development') {
  console.error('Erro: defina APP_PASSWORD no .env antes de iniciar o servidor em produção.');
  process.exit(1);
}

const effectivePassword = APP_PASSWORD || 'dev';

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.post('/login', loginLimiter, (req, res) => login(req, res, effectivePassword));

  app.use(requireAuth(effectivePassword));

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  function validateStoreDate(req, res) {
    const { store, date } = req.query.store !== undefined ? req.query : req.body;
    if (!isValidStore(store)) {
      res.status(400).json({ error: 'Loja inválida. Use "sinta" ou "galpao".' });
      return null;
    }
    if (!isValidDate(date)) {
      res.status(400).json({ error: 'Data inválida. Use o formato AAAA-MM-DD.' });
      return null;
    }
    return { store, date };
  }

  app.get('/api/today', (req, res) => {
    res.json({ date: todayLocalISODate() });
  });

  app.get('/api/day', (req, res) => {
    const v = validateStoreDate(req, res);
    if (!v) return;
    res.json(repo.getDay(v.store, v.date));
  });

  app.get('/api/month', (req, res) => {
    const { store, month } = req.query;
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Mês inválido. Use o formato AAAA-MM.' });
    }
    const summary = repo.getMonthSummary(store, month);
    const productTotals = repo.getMonthProductTotals(store, month);
    res.json({ ...summary, productTotals });
  });

  app.post('/api/products', (req, res) => {
    const { store, date, product } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    if (!isValidProductName(product)) {
      return res.status(400).json({ error: 'Nome do produto deve ter entre 1 e 120 caracteres.' });
    }
    const result = repo.addDailyProduct(store, date, product);
    if (!result.created) {
      return res.status(409).json({ error: 'Este produto já existe nesta data ou nos favoritos.' });
    }
    res.status(201).json({ product: result.product });
  });

  app.post('/api/returns/increment', (req, res) => {
    const { store, date, product, delta } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    if (!isValidProductName(product)) return res.status(400).json({ error: 'Produto inválido.' });
    if (!Number.isInteger(delta)) return res.status(400).json({ error: 'Delta deve ser um número inteiro.' });
    const quantity = repo.incrementQuantity(store, date, product, delta);
    res.json({ product: normalizeProductName(product), quantity });
  });

  app.post('/api/returns/set', (req, res) => {
    const { store, date, product, quantity } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    if (!isValidProductName(product)) return res.status(400).json({ error: 'Produto inválido.' });
    if (!isValidQuantity(quantity)) return res.status(400).json({ error: 'Quantidade deve ser um inteiro >= 0.' });
    repo.setQuantity(store, date, product, quantity);
    res.json({ product: normalizeProductName(product), quantity });
  });

  app.post('/api/products/rename', (req, res) => {
    const { store, date, oldName, newName, quantity } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    if (!isValidProductName(oldName) || !isValidProductName(newName)) {
      return res.status(400).json({ error: 'Nome de produto inválido.' });
    }
    if (!isValidQuantity(quantity)) return res.status(400).json({ error: 'Quantidade inválida.' });
    const result = repo.renameProduct(store, date, oldName, newName, quantity);
    if (!result.ok) {
      return res.status(409).json({ error: 'Já existe um produto com este nome nesta data ou nos favoritos.' });
    }
    res.json({ product: result.product, quantity });
  });

  app.post('/api/favorites/toggle', (req, res) => {
    const { store, product } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidProductName(product)) return res.status(400).json({ error: 'Produto inválido.' });
    const result = repo.toggleFavorite(store, product);
    res.json(result);
  });

  app.post('/api/products/clear-count', (req, res) => {
    const { store, date, product } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    if (!isValidProductName(product)) return res.status(400).json({ error: 'Produto inválido.' });
    repo.clearProductCount(store, date, product);
    res.json({ ok: true });
  });

  app.post('/api/day/clear', (req, res) => {
    const { store, date } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    repo.clearDay(store, date);
    res.json({ ok: true });
  });

  app.delete('/api/products', (req, res) => {
    const { store, date, product } = req.body || {};
    if (!isValidStore(store)) return res.status(400).json({ error: 'Loja inválida.' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'Data inválida.' });
    if (!isValidProductName(product)) return res.status(400).json({ error: 'Produto inválido.' });
    repo.deleteProduct(store, date, product);
    res.json({ ok: true });
  });

  app.post('/api/import', (req, res) => {
    const state = req.body;
    if (!state || typeof state !== 'object') {
      return res.status(400).json({ error: 'Estado inválido para importação.' });
    }
    try {
      const summary = repo.importLegacyState(state);
      res.json({ ok: true, ...summary });
    } catch (err) {
      console.error('Erro ao importar dados legados', err);
      res.status(500).json({ error: 'Falha ao importar dados.' });
    }
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = { createApp };
