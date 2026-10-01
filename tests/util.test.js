const test = require('node:test');
const assert = require('node:assert/strict');
const { todayLocalISODate, productKey, normalizeProductName, isValidDate } = require('../src/util');

test('todayLocalISODate usa o fuso de São Paulo, não UTC', () => {
  const spDate = todayLocalISODate('America/Sao_Paulo');
  assert.match(spDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('productKey ignora acentos, caixa e espaços duplicados', () => {
  assert.equal(productKey('Vestido Floral'), productKey('vestido   floral'));
  assert.equal(productKey('Calça'), productKey('calca'));
  assert.equal(productKey('  Café  '), productKey('cafe'));
});

test('normalizeProductName colapsa espaços e tira as bordas', () => {
  assert.equal(normalizeProductName('  vestido   midi  '), 'vestido midi');
});

test('isValidDate rejeita datas impossíveis como 2026-02-30', () => {
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-02-28'), true);
  assert.equal(isValidDate('2026-13-01'), false);
});
