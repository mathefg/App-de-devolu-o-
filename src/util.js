const STORES = ['sinta', 'galpao'];

// Data de "hoje" no fuso de Brasília, nunca em UTC (depois das 21h UTC já seria
// outro dia em UTC, mas ainda é o mesmo dia em São Paulo).
function todayLocalISODate(tz = process.env.TZ || 'America/Sao_Paulo') {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}

function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isValidStore(store) {
  return STORES.includes(store);
}

function normalizeProductName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

// Chave usada para detectar duplicatas ignorando maiúsculas/minúsculas e acentos.
function productKey(name) {
  return normalizeProductName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function isValidProductName(name) {
  const n = normalizeProductName(name);
  return n.length >= 1 && n.length <= 120;
}

function isValidQuantity(qty) {
  return Number.isInteger(qty) && qty >= 0;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  STORES,
  todayLocalISODate,
  isValidDate,
  isValidStore,
  normalizeProductName,
  productKey,
  isValidProductName,
  isValidQuantity,
  escapeHtml,
};
