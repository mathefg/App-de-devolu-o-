from IPython.display import HTML

html_content = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SINTA-SE LINDA & Galpão - Controle de Devoluções</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        darkBg: '#0f172a',
                        darkCard: '#1e293b',
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .btn-press:active { transform: scale(0.96); }
    </style>
</head>
<body class="bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300 flex flex-col">

    <header class="w-full bg-white dark:bg-darkCard border-b border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-6 shadow-sm sticky top-0 z-30">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="text-2xl">📦</span>
                <h1 id="main-app-title" class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">SINTA-SE LINDA</h1>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="toggleDarkMode()" class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Alternar modo claro/escuro">
                    <svg id="theme-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24">
        <!-- Store Navigation Tabs -->
        <div class="flex gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl mb-6 backdrop-blur">
            <button onclick="switchStore('sinta')" id="tab-sinta" class="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm">
                ✨ SINTA-SE LINDA
            </button>
            <button onclick="switchStore('galpao')" id="tab-galpao" class="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm">
                🏢 GALPÃO UTILIDADES
            </button>
        </div>

        <div class="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Data Selecionada</h2>
                    <input type="date" id="date-picker" onchange="changeDate(this.value)" class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2">
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="openAddProductModal()" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <span class="text-base font-black">+</span> Adicionar Novo Produto
                    </button>
                    <button onclick="generateDailyPDF()" class="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all hover:bg-slate-700 shadow-sm flex items-center gap-1.5">
                        📄 PDF do Dia
                    </button>
                    <button id="btn-monthly-report" onclick="generateMonthlyReport()" class="px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
                        📊 Relatório Mensal
                    </button>
                </div>
            </div>

            <!-- Day Total Counter -->
            <div class="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 mb-6 text-center">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Quantidade Total de Devoluções no Dia</span>
                <div class="flex items-center justify-center gap-3">
                    <input type="number" id="day-total-input" onchange="updateDayTotalDirect(this.value)" min="0" class="w-28 text-center text-3xl sm:text-4xl font-black bg-transparent border-b-2 border-slate-300 dark:border-slate-700 outline-none transition-colors text-slate-800 dark:text-slate-100">
                </div>
                <div class="mt-3 flex justify-center">
                    <button onclick="clearDayCounts()" class="text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 transition-colors">
                        Zerar Contagem do Dia
                    </button>
                </div>
            </div>

            <div class="space-y-3" id="products-container">
                <!-- Products injected here -->
            </div>
        </div>

        <!-- Monthly Summary Card -->
        <div class="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>📅</span> Resumo Mensal do Mês
                </h3>
                <span id="monthly-total-badge" class="text-xs font-bold px-3 py-1 rounded-full border">Total: 0</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Dias com devoluções registradas neste mês (clique em qualquer dia para abrir):</p>
            <div id="monthly-days-list" class="flex flex-wrap gap-2">
                <!-- History pills injected here -->
            </div>
        </div>
    </main>

    <!-- Modal for adding product -->
    <div id="product-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white dark:bg-darkCard rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Adicionar Novo Produto</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Insira o nome do produto para esta data:</p>
            <input type="text" id="new-product-name" onkeydown="handleModalKeyDown(event)" placeholder="Ex: Vestido Floral, Calça Jeans..." class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm mb-5 outline-none text-slate-800 dark:text-slate-100">
            <div class="flex justify-end gap-2.5">
                <button onclick="closeAddProductModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                <button id="btn-modal-confirm" onclick="confirmAddProduct()" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors shadow-sm">Adicionar</button>
            </div>
        </div>
    </div>

    <!-- Custom Alert Modal -->
    <div id="custom-alert-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white dark:bg-darkCard rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
            <div class="text-3xl mb-2">ℹ️️</div>
            <h3 id="alert-title" class="text-base font-bold mb-2 text-slate-800 dark:text-slate-100">Aviso</h3>
            <p id="alert-message" class="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed"></p>
            <button onclick="closeCustomAlert()" class="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 transition-colors">Entendi</button>
        </div>
    </div>

    <script>
        const appState = {
            currentStore: 'sinta',
            currentDate: new Date().toISOString().split('T')[0],
            darkMode: false,
            dailyCustomProducts: {
                sinta: {},
                galpao: {}
            },
            favoriteProducts: {
                sinta: [],
                galpao: []
            },
            data: {
                sinta: {},
                galpao: {}
            }
        };

        window.onload = function() {
            loadFromLocalStorage();
            const todayStr = new Date().toISOString().split('T')[0];
            if (!appState.currentDate) {
                appState.currentDate = todayStr;
            }
            document.getElementById('date-picker').value = appState.currentDate;
            applyTheme();
            updateUI();
        };

        function saveToLocalStorage() {
            try {
                localStorage.setItem('tiktok_returns_state_v3', JSON.stringify(appState));
            } catch (e) {
                console.error('Error saving to localStorage', e);
            }
        }

        function loadFromLocalStorage() {
            try {
                const saved = localStorage.getItem('tiktok_returns_state_v3');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    appState.currentStore = parsed.currentStore || 'sinta';
                    appState.darkMode = parsed.darkMode || false;
                    appState.dailyCustomProducts = parsed.dailyCustomProducts || { sinta: {}, galpao: {} };
                    appState.favoriteProducts = parsed.favoriteProducts || { sinta: [], galpao: [] };
                    appState.data = parsed.data || { sinta: {}, galpao: {} };
                }
            } catch (e) {
                console.error('Error loading from localStorage', e);
            }
        }

        function toggleDarkMode() {
            appState.darkMode = !appState.darkMode;
            applyTheme();
            saveToLocalStorage();
        }

        function applyTheme() {
            const html = document.documentElement;
            const themeIcon = document.getElementById('theme-icon');
            if (appState.darkMode) {
                html.classList.add('dark');
                themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>';
            } else {
                html.classList.remove('dark');
                themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
            }
        }

        function switchStore(store) {
            appState.currentStore = store;
            saveToLocalStorage();
            updateUI();
        }

        function changeDate(val) {
            if (val) {
                appState.currentDate = val;
                updateUI();
            }
        }

        function updateUI() {
            const store = appState.currentStore;
            const tabSinta = document.getElementById('tab-sinta');
            const tabGalpao = document.getElementById('tab-galpao');
            const mainTitle = document.getElementById('main-app-title');
            const btnMonthly = document.getElementById('btn-monthly-report');
            const btnModalConfirm = document.getElementById('btn-modal-confirm');
            const monthlyBadge = document.getElementById('monthly-total-badge');
            const datePicker = document.getElementById('date-picker');
            const dayInput = document.getElementById('day-total-input');

            if (store === 'sinta') {
                tabSinta.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm bg-pink-600 text-white";
                tabGalpao.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-700/50";
                mainTitle.textContent = "SINTA-SE LINDA";
                btnMonthly.className = "px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5";
                btnModalConfirm.className = "px-4 py-2.5 rounded-xl text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white transition-colors shadow-sm";
                monthlyBadge.className = "text-xs font-bold px-3 py-1 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200 dark:border-pink-900/40";
                datePicker.className = datePicker.className.replace(/focus:ring-[a-z0-9_-]+/g, '') + " focus:ring-pink-500";
                dayInput.className = dayInput.className.replace(/focus:border-[a-z0-9_-]+/g, '') + " focus:border-pink-500";
            } else {
                tabGalpao.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm bg-sky-600 text-white";
                tabSinta.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-700/50";
                mainTitle.textContent = "GALPÃO UTILIDADES";
                btnMonthly.className = "px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5";
                btnModalConfirm.className = "px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm";
                monthlyBadge.className = "text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200 dark:border-sky-900/40";
                datePicker.className = datePicker.className.replace(/focus:ring-[a-z0-9_-]+/g, '') + " focus:ring-sky-500";
                dayInput.className = dayInput.className.replace(/focus:border-[a-z0-9_-]+/g, '') + " focus:border-sky-500";
            }

            renderProductsList();
            renderMonthlySummary();
        }

        function renderProductsList() {
            const store = appState.currentStore;
            const date = appState.currentDate;
            const container = document.getElementById('products-container');
            container.innerHTML = '';

            if (!appState.data[store]) appState.data[store] = {};
            if (!appState.data[store][date]) appState.data[store][date] = {};
            if (!appState.dailyCustomProducts[store]) appState.dailyCustomProducts[store] = {};
            if (!appState.dailyCustomProducts[store][date]) appState.dailyCustomProducts[store][date] = [];

            const storeData = appState.data[store][date];
            const dailyProds = appState.dailyCustomProducts[store][date] || [];
            const favProds = appState.favoriteProducts[store] || [];

            const allProductsSet = new Set([...favProds, ...dailyProds]);
            Object.keys(storeData).forEach(p => allProductsSet.add(p));

            const allProducts = Array.from(allProductsSet);
            let totalDay = 0;

            if (allProducts.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <span class="text-3xl block mb-2">📋</span>
                        <p class="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Nenhum produto cadastrado para esta data ainda.</p>
                        <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Clique em "Adicionar Novo Produto" acima para começar.</p>
                    </div>
                `;
                document.getElementById('day-total-input').value = 0;
                return;
            }

            allProducts.forEach(prod => {
                const count = storeData[prod] || 0;
                totalDay += count;

                const isFav = favProds.includes(prod);
                const accentColorClass = store === 'sinta'
                    ? 'text-pink-600 dark:text-pink-400 bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-900/50'
                    : 'text-sky-600 dark:text-sky-400 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-900/50';

                const card = document.createElement('div');
                card.className = "flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700";
                card.innerHTML = `
                    <div class="flex items-center gap-2 truncate max-w-[150px] sm:max-w-[240px]">
                        <button onclick="toggleFavoriteProduct('${prod.replace(/'/g, "\\'")}')" class="text-xs px-1.5 py-1 rounded font-bold transition-colors ${isFav ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500'}" title="${isFav ? 'Favoritado (fixo em todos os dias). Clique para desfavoritar.' : 'Favoritar (tornar fixo em todos os dias)'}">
                            ${isFav ? '★' : '☆'}
                        </button>
                        <button onclick="deleteProductCompletely('${prod.replace(/'/g, "\\'")}')" class="text-red-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded font-bold bg-red-50 dark:bg-red-950/40" title="Excluir este produto completamente">✕</button>
                        <span class="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 truncate" title="${prod}">${prod}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="promptEditProduct('${prod.replace(/'/g, "\\'")}', ${count})" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg bg-slate-100 dark:bg-slate-800" title="Editar nome ou quantidade diretamente">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="clearProductCount('${prod.replace(/'/g, "\\'")}')" class="p-1.5 text-red-400 hover:text-red-600 transition-colors rounded-lg bg-red-50 dark:bg-red-950/30" title="Zerar contagem deste item no dia">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>

                        <div class="flex items-center gap-1.5 ml-1">
                            <button onclick="updateProductCount('${prod.replace(/'/g, "\\'")}', -1)" class="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-lg font-bold border border-red-200 dark:border-red-800/50 btn-press">-</button>
                            <div class="w-11 h-8 rounded-xl border flex items-center justify-center ${accentColorClass}">
                                <span class="text-xs sm:text-sm font-bold">${count}</span>
                            </div>
                            <button onclick="updateProductCount('${prod.replace(/'/g, "\\'")}', 1)" class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-200 dark:border-emerald-800/50 btn-press">+</button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            document.getElementById('day-total-input').value = totalDay;
        }

        function updateProductCount(productName, delta) {
            const store = appState.currentStore;
            const date = appState.currentDate;

            if (!appState.data[store][date]) appState.data[store][date] = {};
            let current = appState.data[store][date][productName] || 0;
            current += delta;
            if (current < 0) current = 0;

            appState.data[store][date][productName] = current;
            saveToLocalStorage();
            updateUI();
        }

        function promptEditProduct(productName, currentVal) {
            const store = appState.currentStore;
            const date = appState.currentDate;

            const enteredName = prompt(`Editar o nome do produto:`, productName);
            if (enteredName === null) return;
            const newName = enteredName.trim();
            if (!newName) {
                showCustomAlert("O nome do produto não pode ficar vazio.");
                return;
            }

            const enteredQty = prompt(`Editar a quantidade para "${newName}" (digite o valor desejado):`, currentVal);
            if (enteredQty === null) return;
            const newQty = parseInt(enteredQty, 10);
            if (isNaN(newQty) || newQty < 0) {
                showCustomAlert("Por favor, insira um número válido para a quantidade.");
                return;
            }

            if (newName !== productName) {
                const favProds = appState.favoriteProducts[store] || [];
                const dailyProds = appState.dailyCustomProducts[store][date] || [];
                if (favProds.includes(newName) || dailyProds.includes(newName)) {
                    showCustomAlert("Já existe um produto com este nome nesta data ou nos favoritos.");
                    return;
                }

                const fIndex = favProds.indexOf(productName);
                if (fIndex !== -1) {
                    appState.favoriteProducts[store][fIndex] = newName;
                }

                const dIndex = dailyProds.indexOf(productName);
                if (dIndex !== -1) {
                    appState.dailyCustomProducts[store][date][dIndex] = newName;
                }
            }

            if (newName !== productName && appState.data[store][date] && appState.data[store][date][productName] !== undefined) {
                delete appState.data[store][date][productName];
            }

            if (!appState.data[store][date]) appState.data[store][date] = {};
            appState.data[store][date][newName] = newQty;

            saveToLocalStorage();
            updateUI();
        }

        function toggleFavoriteProduct(productName) {
            const store = appState.currentStore;
            if (!appState.favoriteProducts[store]) {
                appState.favoriteProducts[store] = [];
            }

            const index = appState.favoriteProducts[store].indexOf(productName);
            if (index !== -1) {
                appState.favoriteProducts[store].splice(index, 1);
            } else {
                appState.favoriteProducts[store].push(productName);
                const date = appState.currentDate;
                if (appState.dailyCustomProducts[store]?.[date]) {
                    appState.dailyCustomProducts[store][date] = appState.dailyCustomProducts[store][date].filter(p => p !== productName);
                }
            }
            saveToLocalStorage();
            updateUI();
        }

        function clearProductCount(productName) {
            const store = appState.currentStore;
            const date = appState.currentDate;
            if (appState.data[store] && appState.data[store][date]) {
                appState.data[store][date][productName] = 0;
                saveToLocalStorage();
                updateUI();
            }
        }

        function deleteProductCompletely(productName) {
            const store = appState.currentStore;
            const date = appState.currentDate;

            appState.favoriteProducts[store] = (appState.favoriteProducts[store] || []).filter(p => p !== productName);

            if (appState.dailyCustomProducts[store]?.[date]) {
                appState.dailyCustomProducts[store][date] = appState.dailyCustomProducts[store][date].filter(p => p !== productName);
            }

            if (appState.data[store]?.[date]?.[productName]) {
                delete appState.data[store][date][productName];
            }

            saveToLocalStorage();
            updateUI();
        }

        function updateDayTotalDirect(val) {
            const num = parseInt(val);
            if (!isNaN(num) && num >= 0) {
                const store = appState.currentStore;
                const date = appState.currentDate;
                if (!appState.data[store][date]) appState.data[store][date] = {};

                const favProds = appState.favoriteProducts[store] || [];
                const dailyProds = appState.dailyCustomProducts[store]?.[date] || [];
                const allProds = [...favProds, ...dailyProds];

                let targetProd = allProds[0];
                if (!targetProd) {
                    targetProd = 'Produto Geral';
                    if (!appState.dailyCustomProducts[store][date]) appState.dailyCustomProducts[store][date] = [];
                    appState.dailyCustomProducts[store][date].push(targetProd);
                }

                appState.data[store][date][targetProd] = num;
                saveToLocalStorage();
                updateUI();
            }
        }

        function clearDayCounts() {
            const store = appState.currentStore;
            const date = appState.currentDate;
            if (appState.data[store] && appState.data[store][date]) {
                appState.data[store][date] = {};
                saveToLocalStorage();
                updateUI();
            }
        }

        function openAddProductModal() {
            document.getElementById('new-product-name').value = '';
            document.getElementById('product-modal').classList.remove('hidden');
            setTimeout(() => document.getElementById('new-product-name').focus(), 50);
        }

        function closeAddProductModal() {
            document.getElementById('product-modal').classList.add('hidden');
        }

        function handleModalKeyDown(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                confirmAddProduct();
            }
        }

        function confirmAddProduct() {
            const nameInput = document.getElementById('new-product-name');
            const name = nameInput.value.trim();
            if (!name) {
                showCustomAlert("Insira o nome do produto.");
                return;
            }

            const store = appState.currentStore;
            const date = appState.currentDate;
            if (!appState.dailyCustomProducts[store]) appState.dailyCustomProducts[store] = {};
            if (!appState.dailyCustomProducts[store][date]) appState.dailyCustomProducts[store][date] = [];
            if (!appState.favoriteProducts[store]) appState.favoriteProducts[store] = [];

            if (appState.favoriteProducts[store].includes(name) || appState.dailyCustomProducts[store][date].includes(name)) {
                showCustomAlert("Este produto já existe nesta data ou nos favoritos.");
                return;
            }

            appState.dailyCustomProducts[store][date].push(name);
            saveToLocalStorage();
            closeAddProductModal();
            updateUI();
        }

        function showCustomAlert(msg) {
            document.getElementById('alert-message').textContent = msg;
            document.getElementById('custom-alert-modal').classList.remove('hidden');
        }

        function closeCustomAlert() {
            document.getElementById('custom-alert-modal').classList.add('hidden');
        }

        function renderMonthlySummary() {
            const store = appState.currentStore;
            const dateStr = appState.currentDate;
            const [year, month] = dateStr.split('-');

            const daysContainer = document.getElementById('monthly-days-list');
            daysContainer.innerHTML = '';

            const storeData = appState.data[store] || {};
            let monthTotal = 0;
            let activeDaysCount = 0;

            const sortedDates = Object.keys(storeData).sort();
            const monthDates = sortedDates.filter(d => d.startsWith(`${year}-${month}`));

            monthDates.forEach(d => {
                const dayObj = storeData[d] || {};
                let daySum = 0;
                Object.values(dayObj).forEach(val => daySum += val);

                if (daySum > 0) {
                    monthTotal += daySum;
                    activeDaysCount++;

                    const pill = document.createElement('button');
                    pill.onclick = () => {
                        appState.currentDate = d;
                        document.getElementById('date-picker').value = d;
                        updateUI();
                    };

                    const isSelected = d === dateStr;
                    let pillStyle = '';
                    if (store === 'sinta') {
                        pillStyle = isSelected ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-pink-400';
                    } else {
                        pillStyle = isSelected ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400';
                    }

                    pill.className = `px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${pillStyle}`;
                    pill.innerHTML = `<span>📅</span> <span>${d.split('-').reverse().join('/')}</span> <span class="ml-1 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px]">${daySum}</span>`;
                    daysContainer.appendChild(pill);
                }
            });

            if (activeDaysCount === 0) {
                daysContainer.innerHTML = `<span class="text-xs text-slate-400 italic">Nenhum registro de devolução neste mês ainda.</span>`;
            }

            document.getElementById('monthly-total-badge').textContent = `Total: ${monthTotal} peças`;
        }

        function generateDailyPDF() {
            const store = appState.currentStore;
            const date = appState.currentDate;
            const storeName = store === 'sinta' ? 'SINTA-SE LINDA' : 'GALPÃO UTILIDADES';
            const storeData = (appState.data[store] && appState.data[store][date]) || {};
            const brandColor = store === 'sinta' ? '#db2777' : '#0284c7';

            let itemsHTML = '';
            let total = 0;
            const favProds = appState.favoriteProducts[store] || [];
            const dailyProds = appState.dailyCustomProducts[store]?.[date] || [];
            const allProdsSet = new Set([...favProds, ...dailyProds, ...Object.keys(storeData)]);
            const allProducts = Array.from(allProdsSet);

            allProducts.forEach(p => {
                const count = storeData[p] || 0;
                if (count > 0) {
                    total += count;
                    itemsHTML += `<tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${p}</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">${count}</td></tr>`;
                }
            });

            if (total === 0) {
                itemsHTML = `<tr><td colspan="2" style="padding: 20px; text-align: center; color: #64748b; font-style: italic;">Nenhum produto com devolução registrada nesta data.</td></tr>`;
            }

            const win = window.open('', '_blank');
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Relatório Diário - ${date}</title>
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #334155; }
                        h2 { color: ${brandColor}; margin-bottom: 4px; font-size: 22px; }
                        h3 { margin-top: 0; color: #64748b; font-size: 14px; font-weight: 500; }
                        .meta { margin: 20px 0; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
                        th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 13px; color: #475569; }
                        .total-box { text-align: right; font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 15px; }
                        @media print { body { padding: 10px; } .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <h2>${storeName}</h2>
                    <h3>Relatório de Devoluções Diárias</h3>
                    <div class="meta"><strong>Data de Referência:</strong> ${date.split('-').reverse().join('/')}</div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th style="text-align: right;">Quantidade Devolvida</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHTML}</tbody>
                    </table>
                    <div class="total-box">Total Geral do Dia: ${total} peças</div>

                    <div class="no-print" style="margin-top: 40px; text-align: center;">
                        <button onclick="window.print()" style="background: ${brandColor}; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">🖨️ Imprimir / Salvar PDF</button>
                    </div>
                    <script>
                        window.onload = function() { setTimeout(() => { window.print(); }, 500); };
                    <\/script>
                </body>
                </html>
            `);
            win.document.close();
        }

        function generateMonthlyReport() {
            const store = appState.currentStore;
            const dateStr = appState.currentDate;
            const [year, month] = dateStr.split('-');
            const storeName = store === 'sinta' ? 'SINTA-SE LINDA' : 'GALPÃO UTILIDADES';
            const storeData = appState.data[store] || {};
            const brandColor = store === 'sinta' ? '#db2777' : '#0284c7';

            let monthTotal = 0;
            const productTotals = {};

            Object.keys(storeData).forEach(d => {
                if (d.startsWith(`${year}-${month}`)) {
                    const dayObj = storeData[d];
                    Object.keys(dayObj).forEach(p => {
                        const val = dayObj[p] || 0;
                        if (val > 0) {
                            productTotals[p] = (productTotals[p] || 0) + val;
                            monthTotal += val;
                        }
                    });
                }
            });

            let breakdownHTML = '';
            Object.keys(productTotals).forEach(p => {
                breakdownHTML += `<tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${p}</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">${productTotals[p]}</td></tr>`;
            });

            if (monthTotal === 0) {
                breakdownHTML = `<tr><td colspan="2" style="padding: 20px; text-align: center; color: #64748b; font-style: italic;">Nenhum registro encontrado para este mês.</td></tr>`;
            }

            const win = window.open('', '_blank');
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Relatório Mensal - ${month}/${year}</title>
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #334155; }
                        h2 { color: ${brandColor}; margin-bottom: 4px; font-size: 22px; }
                        h3 { margin-top: 0; color: #64748b; font-size: 14px; font-weight: 500; }
                        .meta { margin: 20px 0; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
                        th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 13px; color: #475569; }
                        .total-box { text-align: right; font-size: 20px; font-weight: 800; color: ${brandColor}; margin-top: 15px; }
                        @media print { body { padding: 10px; } .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <h2>${storeName}</h2>
                    <h3>Relatório Empresarial Mensal (${month}/${year})</h3>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                    <table>
                        <thead>
                            <tr>
                                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Produto</th>
                                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Total Acumulado no Mês</th>
                            </tr>
                        </thead>
                        <tbody>${breakdownHTML}</tbody>
                    </table>
                    <div class="total-box">Total Geral do Mês: ${monthTotal} peças</div>

                    <div class="no-print" style="margin-top: 40px; text-align: center;">
                        <button onclick="window.print()" style="background: ${brandColor}; color: white; border: nones; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">🖨️ Imprimir / Salvar PDF</button>
                    </div>
                    <script>
                        window.onload = function() { setTimeout(() => { window.print(); }, 500); };
                    <\/script>
                </body>
                </html>
            `);
            win.document.close();
        }
    </script>
</body>
</html>
"""

display(HTML(html_content))
