const db = require('./db');
const { productKey, normalizeProductName } = require('./util');

function getDay(store, date) {
  const favorites = db
    .prepare('SELECT product_key, product FROM favorites WHERE store = ?')
    .all(store);
  const dailyProducts = db
    .prepare('SELECT product_key, product FROM daily_products WHERE store = ? AND date = ?')
    .all(store, date);
  const quantities = db
    .prepare('SELECT product_key, product, quantity FROM returns WHERE store = ? AND date = ?')
    .all(store, date);

  const byKey = new Map();
  for (const f of favorites) byKey.set(f.product_key, { product: f.product, quantity: 0 });
  for (const d of dailyProducts) {
    if (!byKey.has(d.product_key)) byKey.set(d.product_key, { product: d.product, quantity: 0 });
  }
  for (const q of quantities) {
    const entry = byKey.get(q.product_key) || { product: q.product, quantity: 0 };
    entry.quantity = q.quantity;
    entry.product = q.product;
    byKey.set(q.product_key, entry);
  }

  const favKeys = new Set(favorites.map((f) => f.product_key));
  const products = Array.from(byKey.entries())
    .map(([key, v]) => ({ key, product: v.product, quantity: v.quantity, favorite: favKeys.has(key) }))
    .sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'));

  const total = products.reduce((sum, p) => sum + p.quantity, 0);
  return { store, date, products, total };
}

function findExistingKeyForOtherDates(store, name) {
  const key = productKey(name);
  const row = db
    .prepare(
      'SELECT product FROM returns WHERE store = ? AND product_key = ? UNION SELECT product FROM daily_products WHERE store = ? AND product_key = ? UNION SELECT product FROM favorites WHERE store = ? AND product_key = ? LIMIT 1'
    )
    .get(store, key, store, key, store, key);
  return row ? row.product : null;
}

function addDailyProduct(store, date, name) {
  const clean = normalizeProductName(name);
  const key = productKey(clean);
  const canonical = findExistingKeyForOtherDates(store, clean) || clean;
  const exists = db
    .prepare(
      'SELECT 1 FROM daily_products WHERE store = ? AND date = ? AND product_key = ? UNION SELECT 1 FROM favorites WHERE store = ? AND product_key = ?'
    )
    .get(store, date, key, store, key);
  if (exists) {
    return { created: false, product: canonical, key };
  }
  db.prepare(
    'INSERT INTO daily_products (store, date, product_key, product) VALUES (?, ?, ?, ?)'
  ).run(store, date, key, canonical);
  return { created: true, product: canonical, key };
}

const incrementStmt = db.prepare(`
  INSERT INTO returns (store, date, product_key, product, quantity)
  VALUES (?, ?, ?, ?, MAX(0, ?))
  ON CONFLICT(store, date, product_key)
  DO UPDATE SET quantity = MAX(0, quantity + ?), product = excluded.product
`);

function incrementQuantity(store, date, name, delta) {
  const clean = normalizeProductName(name);
  const key = productKey(clean);
  const canonical = findExistingKeyForOtherDates(store, clean) || clean;
  incrementStmt.run(store, date, key, canonical, delta, delta);
  const row = db
    .prepare('SELECT quantity FROM returns WHERE store = ? AND date = ? AND product_key = ?')
    .get(store, date, key);
  return row ? row.quantity : 0;
}

function setQuantity(store, date, name, quantity) {
  const clean = normalizeProductName(name);
  const key = productKey(clean);
  const canonical = findExistingKeyForOtherDates(store, clean) || clean;
  db.prepare(
    `INSERT INTO returns (store, date, product_key, product, quantity)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(store, date, product_key) DO UPDATE SET quantity = excluded.quantity, product = excluded.product`
  ).run(store, date, key, canonical, quantity);
  return quantity;
}

function renameProduct(store, date, oldName, newName, quantity) {
  const oldKey = productKey(oldName);
  const newClean = normalizeProductName(newName);
  const newKey = productKey(newClean);

  if (newKey !== oldKey) {
    const clash = db
      .prepare(
        'SELECT 1 FROM daily_products WHERE store = ? AND date = ? AND product_key = ? UNION SELECT 1 FROM favorites WHERE store = ? AND product_key = ?'
      )
      .get(store, date, newKey, store, newKey);
    if (clash) {
      return { ok: false, reason: 'duplicate' };
    }
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE favorites SET product_key = ?, product = ? WHERE store = ? AND product_key = ?').run(
      newKey, newClean, store, oldKey
    );
    db.prepare(
      'UPDATE daily_products SET product_key = ?, product = ? WHERE store = ? AND date = ? AND product_key = ?'
    ).run(newKey, newClean, store, date, oldKey);
    db.prepare('DELETE FROM returns WHERE store = ? AND date = ? AND product_key = ?').run(store, date, oldKey);
    db.prepare(
      `INSERT INTO returns (store, date, product_key, product, quantity)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(store, date, product_key) DO UPDATE SET quantity = excluded.quantity, product = excluded.product`
    ).run(store, date, newKey, newClean, quantity);
  });
  tx();
  return { ok: true, product: newClean };
}

function toggleFavorite(store, name) {
  const clean = normalizeProductName(name);
  const key = productKey(clean);
  const existing = db.prepare('SELECT product FROM favorites WHERE store = ? AND product_key = ?').get(store, key);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE store = ? AND product_key = ?').run(store, key);
    return { favorite: false, product: existing.product };
  }
  const canonical = findExistingKeyForOtherDates(store, clean) || clean;
  db.prepare('INSERT INTO favorites (store, product_key, product) VALUES (?, ?, ?)').run(store, key, canonical);
  return { favorite: true, product: canonical };
}

function clearProductCount(store, date, name) {
  const key = productKey(name);
  setQuantity(store, date, name, 0);
}

function clearDay(store, date) {
  db.prepare('DELETE FROM returns WHERE store = ? AND date = ?').run(store, date);
}

function deleteProduct(store, date, name) {
  const key = productKey(name);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM favorites WHERE store = ? AND product_key = ?').run(store, key);
    db.prepare('DELETE FROM daily_products WHERE store = ? AND date = ? AND product_key = ?').run(store, date, key);
    db.prepare('DELETE FROM returns WHERE store = ? AND date = ? AND product_key = ?').run(store, date, key);
  });
  tx();
}

function getMonthSummary(store, yearMonth) {
  const rows = db
    .prepare(
      `SELECT date, SUM(quantity) as total FROM returns WHERE store = ? AND date LIKE ? GROUP BY date HAVING total > 0 ORDER BY date`
    )
    .all(store, `${yearMonth}-%`);
  const monthTotal = rows.reduce((sum, r) => sum + r.total, 0);
  return { store, month: yearMonth, days: rows, total: monthTotal };
}

function getMonthProductTotals(store, yearMonth) {
  const rows = db
    .prepare(
      `SELECT product, SUM(quantity) as total FROM returns WHERE store = ? AND date LIKE ? GROUP BY product_key HAVING total > 0 ORDER BY total DESC`
    )
    .all(store, `${yearMonth}-%`);
  return rows;
}

function importLegacyState(state) {
  const summary = { productsImported: 0, quantitiesImported: 0, favoritesImported: 0 };
  const tx = db.transaction(() => {
    for (const store of ['sinta', 'galpao']) {
      const favs = (state.favoriteProducts && state.favoriteProducts[store]) || [];
      for (const name of favs) {
        if (!normalizeProductName(name)) continue;
        const res = toggleFavoriteIfAbsent(store, name);
        if (res) summary.favoritesImported++;
      }

      const dailyCustom = (state.dailyCustomProducts && state.dailyCustomProducts[store]) || {};
      for (const [date, names] of Object.entries(dailyCustom)) {
        if (!isValidDateLike(date)) continue;
        for (const name of names || []) {
          if (!normalizeProductName(name)) continue;
          const res = addDailyProduct(store, date, name);
          if (res.created) summary.productsImported++;
        }
      }

      const data = (state.data && state.data[store]) || {};
      for (const [date, products] of Object.entries(data)) {
        if (!isValidDateLike(date)) continue;
        for (const [name, qty] of Object.entries(products || {})) {
          const n = Number(qty);
          if (!normalizeProductName(name) || !Number.isFinite(n)) continue;
          incrementQuantity(store, date, name, Math.round(n));
          summary.quantitiesImported++;
        }
      }
    }
  });
  tx();
  return summary;
}

function toggleFavoriteIfAbsent(store, name) {
  const key = productKey(name);
  const existing = db.prepare('SELECT 1 FROM favorites WHERE store = ? AND product_key = ?').get(store, key);
  if (existing) return false;
  const clean = normalizeProductName(name);
  db.prepare('INSERT INTO favorites (store, product_key, product) VALUES (?, ?, ?)').run(store, key, clean);
  return true;
}

function isValidDateLike(d) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

module.exports = {
  getDay,
  addDailyProduct,
  incrementQuantity,
  setQuantity,
  renameProduct,
  toggleFavorite,
  clearProductCount,
  clearDay,
  deleteProduct,
  getMonthSummary,
  getMonthProductTotals,
  importLegacyState,
};
