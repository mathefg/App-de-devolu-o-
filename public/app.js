(function () {
  'use strict';

  const LEGACY_KEYS = ['tiktok_returns_state_v3', 'executive_returns_state_v4'];
  const PREFS_KEY = 'devolucoes_ui_prefs_v1';
  const MIGRATED_KEY = 'devolucoes_migrated_v1';
  const POLL_INTERVAL_MS = 15000;

  const state = {
    currentStore: 'sinta',
    currentDate: null,
    darkMode: false,
    day: { products: [], total: 0 },
    month: { days: [], total: 0 },
  };

  let pollTimer = null;
  let pendingConfirmAction = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      state.darkMode = !!saved.darkMode;
      state.currentStore = saved.currentStore === 'galpao' ? 'galpao' : 'sinta';
    } catch (e) {
      console.error('Erro ao ler preferências locais', e);
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ darkMode: state.darkMode, currentStore: state.currentStore })
      );
    } catch (e) {
      console.error('Erro ao salvar preferências locais', e);
    }
  }

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Não autenticado');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Erro desconhecido');
    }
    return data;
  }

  function showToast(msg, isError) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg ${
      isError ? 'bg-red-600' : 'bg-slate-900'
    }`;
    setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  function showAlert(msg) {
    document.getElementById('alert-message').textContent = msg;
    document.getElementById('custom-alert-modal').classList.remove('hidden');
  }

  function showConfirm(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    pendingConfirmAction = onConfirm;
    document.getElementById('custom-confirm-modal').classList.remove('hidden');
  }

  function applyTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    if (state.darkMode) {
      html.classList.add('dark');
      themeIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>';
    } else {
      html.classList.remove('dark');
      themeIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
    }
  }

  function applyStoreStyles() {
    const store = state.currentStore;
    const tabSinta = document.getElementById('tab-sinta');
    const tabGalpao = document.getElementById('tab-galpao');
    const mainTitle = document.getElementById('main-app-title');
    const headerIconBg = document.getElementById('header-icon-bg');
    const btnMonthly = document.getElementById('btn-monthly-report');
    const btnModalConfirm = document.getElementById('btn-modal-confirm');
    const btnEditConfirm = document.getElementById('btn-edit-confirm');
    const monthlyBadge = document.getElementById('monthly-total-badge');
    const datePicker = document.getElementById('date-picker');

    const base =
      'py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm flex items-center justify-center gap-2';
    const inactive =
      'text-slate-500 dark:text-slate-400 hover:bg-slate-300/40 dark:hover:bg-slate-800';

    if (store === 'sinta') {
      tabSinta.className = `${base} bg-pink-600 text-white`;
      tabGalpao.className = `${base} ${inactive}`;
      mainTitle.textContent = 'SINTA-SE LINDA';
      headerIconBg.className =
        'w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400 font-bold';
      btnMonthly.className =
        'px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5';
      btnModalConfirm.className =
        'px-5 py-3 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white transition-colors shadow-md';
      btnEditConfirm.className = btnModalConfirm.className;
      monthlyBadge.className =
        'text-xs font-bold px-3.5 py-1.5 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200 dark:border-pink-900/40 shadow-sm';
      datePicker.className =
        datePicker.className.replace(/focus:ring-[a-z0-9_-]+/g, '') + ' focus:ring-pink-500';
    } else {
      tabGalpao.className = `${base} bg-sky-600 text-white`;
      tabSinta.className = `${base} ${inactive}`;
      mainTitle.textContent = 'GALPÃO UTILIDADES';
      headerIconBg.className =
        'w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-bold';
      btnMonthly.className =
        'px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5';
      btnModalConfirm.className =
        'px-5 py-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-md';
      btnEditConfirm.className = btnModalConfirm.className;
      monthlyBadge.className =
        'text-xs font-bold px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200 dark:border-sky-900/40 shadow-sm';
      datePicker.className =
        datePicker.className.replace(/focus:ring-[a-z0-9_-]+/g, '') + ' focus:ring-sky-500';
    }
  }

  function brandColor() {
    return state.currentStore === 'sinta' ? '#db2777' : '#0284c7';
  }

  function storeDisplayName() {
    return state.currentStore === 'sinta' ? 'SINTA-SE LINDA' : 'GALPÃO UTILIDADES';
  }

  async function loadDay() {
    const container = document.getElementById('products-container');
    const loading = document.getElementById('loading-indicator');
    loading.classList.remove('hidden');
    try {
      const day = await api(
        'GET',
        `/api/day?store=${encodeURIComponent(state.currentStore)}&date=${encodeURIComponent(state.currentDate)}`
      );
      state.day = day;
      renderProducts();
      setStatus(true);
    } catch (e) {
      console.error(e);
      setStatus(false);
    } finally {
      loading.classList.add('hidden');
    }
  }

  async function loadMonth() {
    const [year, month] = state.currentDate.split('-');
    try {
      const summary = await api(
        'GET',
        `/api/month?store=${encodeURIComponent(state.currentStore)}&month=${year}-${month}`
      );
      state.month = summary;
      renderMonthlySummary();
    } catch (e) {
      console.error(e);
    }
  }

  function setStatus(online) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (online) {
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
      text.textContent = 'Sistema Online';
    } else {
      dot.className = 'w-2 h-2 rounded-full bg-red-500';
      text.textContent = 'Offline - verifique a conexão';
    }
  }

  function renderProducts() {
    const container = document.getElementById('products-container');
    const products = state.day.products || [];
    document.getElementById('kpi-items-count').textContent = products.length;
    document.getElementById('kpi-day-total').textContent = state.day.total || 0;
    document.getElementById('day-total-display').textContent = state.day.total || 0;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
            <span class="text-3xl block mb-3">📋</span>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhum produto cadastrado para esta data.</p>
            <p class="text-xs text-slate-400 mb-4">Clique em "+ Novo Produto" acima para iniciar o lançamento.</p>
        </div>`;
      return;
    }

    const accentColorClass =
      state.currentStore === 'sinta'
        ? 'text-pink-600 dark:text-pink-400 bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900/50'
        : 'text-sky-600 dark:text-sky-400 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/50';

    container.innerHTML = products
      .map((p) => {
        const isFav = p.favorite;
        const safeName = escapeHtml(p.product);
        return `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-slate-900/60 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 gap-3" data-product="${safeName}">
            <div class="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button data-action="toggle-fav" aria-label="Favoritar produto" class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                      isFav
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                    }" title="${isFav ? 'Produto Favorito (Fixo em todos os dias)' : 'Favoritar produto'}">
                        ${isFav ? '★' : '☆'}
                    </button>
                    <button data-action="delete" aria-label="Excluir produto" class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-red-50 text-red-400 hover:text-red-600 dark:bg-red-950/40 transition-colors" title="Excluir produto do sistema">✕</button>
                </div>
                <div class="truncate">
                    <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title="${safeName}">${safeName}</h4>
                    <span class="text-[11px] text-slate-400 font-medium">Devoluções registradas: <strong class="text-slate-700 dark:text-slate-300">${p.quantity}</strong></span>
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-1">
                    <button data-action="edit" aria-label="Editar produto" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl bg-slate-100 dark:bg-slate-800" title="Editar nome ou valor">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button data-action="clear-count" aria-label="Zerar item" class="p-2 text-red-400 hover:text-red-600 transition-colors rounded-xl bg-red-50 dark:bg-red-950/30" title="Zerar item neste dia">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    <button data-action="decrement" aria-label="Diminuir quantidade" class="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-lg font-bold border border-red-200 dark:border-red-800/50 btn-press">-</button>
                    <div class="w-12 h-9 rounded-xl border flex items-center justify-center font-black ${accentColorClass}">
                        <span class="text-sm">${p.quantity}</span>
                    </div>
                    <button data-action="increment" aria-label="Aumentar quantidade" class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-200 dark:border-emerald-800/50 btn-press">+</button>
                </div>
            </div>
        </div>`;
      })
      .join('');
  }

  function renderMonthlySummary() {
    const daysContainer = document.getElementById('monthly-days-list');
    const days = state.month.days || [];

    if (days.length === 0) {
      daysContainer.innerHTML = `<span class="text-xs text-slate-400 italic">Nenhum registro de devolução neste mês ainda.</span>`;
    } else {
      daysContainer.innerHTML = days
        .map((d) => {
          const isSelected = d.date === state.currentDate;
          let pillStyle;
          if (state.currentStore === 'sinta') {
            pillStyle = isSelected
              ? 'bg-pink-600 text-white border-pink-600 shadow-md font-extrabold'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-pink-400 font-bold';
          } else {
            pillStyle = isSelected
              ? 'bg-sky-600 text-white border-sky-600 shadow-md font-extrabold'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 font-bold';
          }
          const displayDate = d.date.split('-').reverse().join('/');
          return `<button data-date="${d.date}" class="px-3.5 py-2.5 rounded-xl text-xs border transition-all flex items-center gap-2 ${pillStyle}">
            <span>📅</span> <span>${displayDate}</span> <span class="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-[11px] font-black">${d.total}</span>
          </button>`;
        })
        .join('');
    }

    document.getElementById('monthly-total-badge').textContent = `Total do Mês: ${state.month.total || 0} peças`;
    document.getElementById('kpi-month-total').textContent = state.month.total || 0;
  }

  async function refreshAll() {
    await Promise.all([loadDay(), loadMonth()]);
  }

  async function switchStore(store) {
    state.currentStore = store;
    savePrefs();
    applyStoreStyles();
    await refreshAll();
  }

  async function changeDate(val) {
    if (!val) return;
    state.currentDate = val;
    await refreshAll();
  }

  async function setTodayDate() {
    const { date } = await api('GET', '/api/today');
    state.currentDate = date;
    document.getElementById('date-picker').value = date;
    await refreshAll();
  }

  function openAddProductModal() {
    document.getElementById('new-product-name').value = '';
    document.getElementById('product-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('new-product-name').focus(), 50);
  }

  function closeAddProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
  }

  async function confirmAddProduct() {
    const nameInput = document.getElementById('new-product-name');
    const name = nameInput.value.trim();
    if (!name) {
      showAlert('Insira o nome do produto.');
      return;
    }
    try {
      await api('POST', '/api/products', { store: state.currentStore, date: state.currentDate, product: name });
      closeAddProductModal();
      await loadDay();
    } catch (e) {
      showAlert(e.message);
    }
  }

  let editingProduct = null;

  function openEditModal(productName, quantity) {
    editingProduct = { oldName: productName, quantity };
    document.getElementById('edit-product-name').value = productName;
    document.getElementById('edit-product-qty').value = quantity;
    document.getElementById('edit-modal').classList.remove('hidden');
  }

  function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    editingProduct = null;
  }

  async function confirmEditProduct() {
    if (!editingProduct) return;
    const newName = document.getElementById('edit-product-name').value.trim();
    const newQtyRaw = document.getElementById('edit-product-qty').value;
    const newQty = parseInt(newQtyRaw, 10);

    if (!newName) {
      showAlert('O nome do produto não pode ficar vazio.');
      return;
    }
    if (Number.isNaN(newQty) || newQty < 0) {
      showAlert('Por favor, insira um número válido para a quantidade.');
      return;
    }
    try {
      await api('POST', '/api/products/rename', {
        store: state.currentStore,
        date: state.currentDate,
        oldName: editingProduct.oldName,
        newName,
        quantity: newQty,
      });
      closeEditModal();
      await loadDay();
    } catch (e) {
      showAlert(e.message);
    }
  }

  async function updateProductCount(productName, delta) {
    try {
      await api('POST', '/api/returns/increment', {
        store: state.currentStore,
        date: state.currentDate,
        product: productName,
        delta,
      });
      await loadDay();
      await loadMonth();
    } catch (e) {
      showAlert(e.message);
    }
  }

  async function toggleFavoriteProduct(productName) {
    try {
      await api('POST', '/api/favorites/toggle', { store: state.currentStore, product: productName });
      await loadDay();
    } catch (e) {
      showAlert(e.message);
    }
  }

  async function clearProductCount(productName) {
    showConfirm('Zerar Item', `Zerar a contagem de "${productName}" nesta data?`, async () => {
      try {
        await api('POST', '/api/products/clear-count', {
          store: state.currentStore,
          date: state.currentDate,
          product: productName,
        });
        await loadDay();
        await loadMonth();
      } catch (e) {
        showAlert(e.message);
      }
    });
  }

  async function deleteProductCompletely(productName) {
    showConfirm('Excluir Produto', `Excluir "${productName}" permanentemente do sistema?`, async () => {
      try {
        await api('DELETE', '/api/products', {
          store: state.currentStore,
          date: state.currentDate,
          product: productName,
        });
        await loadDay();
      } catch (e) {
        showAlert(e.message);
      }
    });
  }

  function clearDayCounts() {
    showConfirm('Zerar Dia', 'Zerar todas as contagens registradas nesta data?', async () => {
      try {
        await api('POST', '/api/day/clear', { store: state.currentStore, date: state.currentDate });
        await loadDay();
        await loadMonth();
      } catch (e) {
        showAlert(e.message);
      }
    });
  }

  function printHtml(title, bodyHtml) {
    const frame = document.getElementById('print-frame');
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
      <style>
        body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 40px; color: #334155; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 20px; }
        h2 { color: ${brandColor()}; margin: 0 0 4px 0; font-size: 24px; }
        h3 { margin: 0; color: #64748b; font-size: 14px; font-weight: 500; }
        .meta { margin: 20px 0; font-size: 14px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
        th { background: #f1f5f9; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; }
        .total-box { text-align: right; font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        @media print { body { padding: 10px; } }
      </style></head><body>${bodyHtml}</body></html>`);
    doc.close();
    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }, 300);
  }

  function generateDailyPDF() {
    const products = state.day.products || [];
    const rows = products.filter((p) => p.quantity > 0);
    const total = rows.reduce((s, p) => s + p.quantity, 0);
    const itemsHTML =
      rows.length > 0
        ? rows
            .map(
              (p) =>
                `<tr><td>${escapeHtml(p.product)}</td><td style="text-align:right;font-weight:bold;">${p.quantity}</td></tr>`
            )
            .join('')
        : `<tr><td colspan="2" style="padding: 24px; text-align: center; color: #64748b; font-style: italic;">Nenhum produto com devolução registrada nesta data.</td></tr>`;

    const displayDate = state.currentDate.split('-').reverse().join('/');
    const body = `
      <div class="header">
        <div><h2>${escapeHtml(storeDisplayName())}</h2><h3>Relatório Executivo Diário de Devoluções</h3></div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">Emitido em: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="meta"><strong>Data de Referência:</strong> ${displayDate}</div>
      <table><thead><tr><th>Produto / Mercadoria</th><th style="text-align:right;">Quantidade Devolvida</th></tr></thead><tbody>${itemsHTML}</tbody></table>
      <div class="total-box">Total Geral Consolidado: ${total} peças</div>`;
    printHtml(`Relatório Diário - ${state.currentDate}`, body);
  }

  async function generateMonthlyReport() {
    const [year, month] = state.currentDate.split('-');
    const productTotals = state.month.productTotals || [];
    const monthTotal = state.month.total || 0;

    const breakdownHTML =
      productTotals.length > 0
        ? productTotals
            .map((p) => `<tr><td>${escapeHtml(p.product)}</td><td style="text-align:right;font-weight:bold;">${p.total}</td></tr>`)
            .join('')
        : `<tr><td colspan="2" style="padding: 24px; text-align: center; color: #64748b; font-style: italic;">Nenhum registro encontrado para este mês.</td></tr>`;

    const body = `
      <div class="header">
        <div><h2>${escapeHtml(storeDisplayName())}</h2><h3>Relatório Executivo de Fechamento Mensal</h3></div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">Período: ${month}/${year}<br>Emitido em: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="meta"><strong>Consolidado do Mês:</strong> ${month}/${year}</div>
      <table><thead><tr><th>Produto / Mercadoria</th><th style="text-align:right;">Total Acumulado no Mês</th></tr></thead><tbody>${breakdownHTML}</tbody></table>
      <div class="total-box">Total Geral do Mês: ${monthTotal} peças</div>`;
    printHtml(`Relatório Mensal - ${month}/${year}`, body);
  }

  function findLegacyState() {
    for (const key of LEGACY_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.error('Erro ao ler dados antigos', e);
        }
      }
    }
    return null;
  }

  async function checkLegacyImport() {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const legacy = findLegacyState();
    if (!legacy) return;
    document.getElementById('import-banner').classList.remove('hidden');
  }

  function setupImportBanner() {
    document.getElementById('btn-import-dismiss').addEventListener('click', () => {
      document.getElementById('import-banner').classList.add('hidden');
    });
    document.getElementById('btn-import-confirm').addEventListener('click', async () => {
      const legacy = findLegacyState();
      if (!legacy) return;
      try {
        const summary = await api('POST', '/api/import', legacy);
        localStorage.setItem(MIGRATED_KEY, '1');
        document.getElementById('import-banner').classList.add('hidden');
        showToast(
          `Importação concluída: ${summary.quantitiesImported} registros, ${summary.favoritesImported} favoritos.`
        );
        await refreshAll();
      } catch (e) {
        showAlert('Falha ao importar: ' + e.message);
      }
    });
  }

  function setupEventDelegation() {
    document.getElementById('products-container').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const card = btn.closest('[data-product]');
      const productName = card.dataset.product;
      const action = btn.dataset.action;
      const quantityText = card.querySelector('.font-black span')?.textContent || '0';

      switch (action) {
        case 'toggle-fav':
          toggleFavoriteProduct(productName);
          break;
        case 'delete':
          deleteProductCompletely(productName);
          break;
        case 'edit':
          openEditModal(productName, parseInt(quantityText, 10) || 0);
          break;
        case 'clear-count':
          clearProductCount(productName);
          break;
        case 'increment':
          updateProductCount(productName, 1);
          break;
        case 'decrement':
          updateProductCount(productName, -1);
          break;
      }
    });

    document.getElementById('monthly-days-list').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-date]');
      if (!btn) return;
      state.currentDate = btn.dataset.date;
      document.getElementById('date-picker').value = state.currentDate;
      refreshAll();
    });

    document.getElementById('tab-sinta').addEventListener('click', () => switchStore('sinta'));
    document.getElementById('tab-galpao').addEventListener('click', () => switchStore('galpao'));
    document.getElementById('date-picker').addEventListener('change', (e) => changeDate(e.target.value));
    document.getElementById('btn-today').addEventListener('click', setTodayDate);
    document.getElementById('btn-add-product').addEventListener('click', openAddProductModal);
    document.getElementById('btn-modal-cancel').addEventListener('click', closeAddProductModal);
    document.getElementById('btn-modal-confirm').addEventListener('click', confirmAddProduct);
    document.getElementById('new-product-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmAddProduct();
      }
    });
    document.getElementById('btn-edit-cancel').addEventListener('click', closeEditModal);
    document.getElementById('btn-edit-confirm').addEventListener('click', confirmEditProduct);
    document.getElementById('btn-clear-day').addEventListener('click', clearDayCounts);
    document.getElementById('btn-daily-pdf').addEventListener('click', generateDailyPDF);
    document.getElementById('btn-monthly-report').addEventListener('click', generateMonthlyReport);
    document.getElementById('btn-alert-ok').addEventListener('click', () => {
      document.getElementById('custom-alert-modal').classList.add('hidden');
    });
    document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
      document.getElementById('custom-confirm-modal').classList.add('hidden');
      pendingConfirmAction = null;
    });
    document.getElementById('btn-confirm-ok').addEventListener('click', async () => {
      document.getElementById('custom-confirm-modal').classList.add('hidden');
      const action = pendingConfirmAction;
      pendingConfirmAction = null;
      if (action) await action();
    });
    document.getElementById('btn-theme').addEventListener('click', () => {
      state.darkMode = !state.darkMode;
      applyTheme();
      savePrefs();
    });
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (document.hidden) return;
      loadDay();
      loadMonth();
    }, POLL_INTERVAL_MS);
  }

  async function init() {
    loadPrefs();
    applyTheme();
    applyStoreStyles();
    setupEventDelegation();
    setupImportBanner();

    try {
      const { date } = await api('GET', '/api/today');
      state.currentDate = date;
    } catch (e) {
      state.currentDate = new Date().toISOString().split('T')[0];
    }
    document.getElementById('date-picker').value = state.currentDate;

    await checkLegacyImport();
    await refreshAll();
    startPolling();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
