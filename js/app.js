/**
 * Techmess ERP - Sistema Profissional de Gestão
 * Versão 5.0 - Build Estável com Cálculo de Lucro
 * * Novas Funcionalidades:
 * - Cálculo e armazenamento do lucro em cada venda.
 * - Exibição do lucro nos detalhes da venda e nos relatórios de vendas.
 * * Correções Anteriores Incluídas:
 * - Adicionado event listener ao botão "Dashboard" da navegação.
 * - Corrigido o problema de contexto (`this`) em todos os event listeners.
 * - Restaurada a lógica de negócio para criação de Contas a Pagar APENAS no recebimento da compra.
 */

// CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyARb-0QE9QcYD2OjkCsOj0pmKTgkJQRlSg",
    authDomain: "vipcell-gestor.firebaseapp.com",
    databaseURL: "https://vipcell-gestor-default-rtdb.firebaseio.com",
    projectId: "vipcell-gestor",
    storageBucket: "vipcell-gestor.firebasestorage.app",
    messagingSenderId: "259960306679",
    appId: "1:259960306679:web:ad7a41cd1842862f7f8cf2"
};

// CONFIGURAÇÃO CLOUDINARY
const CLOUDINARY_CLOUD_NAME = 'dmuvm1o6m';
const CLOUDINARY_UPLOAD_PRESET = 'poh3ej4m';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// INICIALIZAÇÃO
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// ESTADO GLOBAL DA APLICAÇÃO
const AppState = {
    cart: {},
    products: {},
    suppliers: {},
    customers: {},
    currentPurchaseItems: [],
    currentSaleItems: [],
    currentOrderToConfirm: null,
    salesHistory: {},
    purchases: {},
    accountsReceivable: {},
    accountsPayable: {},
    isAuthenticated: false
};

// UTILITÁRIOS
const Utils = {
    formatCurrency: (value) => {
        if (isNaN(value)) value = 0;
        return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
    },
    formatDate: (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    
    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    validateForm: (fields) => {
        for (const field of fields) {
            if (!field.value || field.value.trim() === '') {
                field.classList.add('error-field');
                return false;
            } else {
                field.classList.remove('error-field');
            }
        }
        return true;
    }
};

// SELETORES DOM
const DOM = {
    // Navegação
    publicView: document.getElementById('public-view'),
    managementPanel: document.getElementById('management-panel'),
    authButton: document.getElementById('auth-button'),
    
    // Navegação superior
    navHome: document.getElementById('nav-home'),
    navShop: document.getElementById('nav-shop'),
    navCart: document.getElementById('nav-cart'),
    navDashboard: document.getElementById('nav-dashboard'),
    cartItemCount: document.getElementById('cart-item-count'),
    
    // Loja pública
    productList: document.getElementById('product-list'),
    
    // Carrinho
    cartModal: document.getElementById('cart-modal'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    checkoutButton: document.getElementById('checkout-button'),
    closeCartModal: document.getElementById('close-cart-modal'),
    
    // Checkout
    checkoutModal: document.getElementById('checkout-modal'),
    customerName: document.getElementById('customer-name'),
    customerWhatsapp: document.getElementById('customer-whatsapp'),
    submitCheckout: document.getElementById('submit-checkout'),
    closeCheckoutModal: document.getElementById('close-checkout-modal'),
    
    // Dashboard
    monthlyRevenue: document.getElementById('monthly-revenue'),
    dailySales: document.getElementById('daily-sales'),
    totalStock: document.getElementById('total-stock'),
    pendingReceivables: document.getElementById('pending-receivables'),
    lowStockAlerts: document.getElementById('low-stock-alerts'),
    resetSystemButton: document.getElementById('reset-system-button'),
    
    // Vendas
    pendingOrders: document.getElementById('pending-orders'),
    salesHistoryList: document.getElementById('sales-history-list'),
    newSaleButton: document.getElementById('new-sale-button'),
    salesHistoryFilterProduct: document.getElementById('sales-history-filter-product'),
    salesHistoryFilterIdentifier: document.getElementById('sales-history-filter-identifier'),
    applySalesHistoryFilter: document.getElementById('apply-sales-history-filter'),
    
    // Estoque
    productManagementList: document.getElementById('product-management-list'),
    addProductModelButton: document.getElementById('add-product-model-button'),
    stockFilterProduct: document.getElementById('stock-filter-product'),
    stockFilterIdentifier: document.getElementById('stock-filter-identifier'),
    
    // Compras
    purchaseList: document.getElementById('purchase-list'),
    newPurchaseButton: document.getElementById('new-purchase-button'),
    
    // Clientes
    customerList: document.getElementById('customer-list'),
    addCustomerButton: document.getElementById('add-customer-button'),
    
    // Fornecedores
    supplierList: document.getElementById('supplier-list'),
    addSupplierButton: document.getElementById('add-supplier-button'),
    
    // Financeiro
    cashBalance: document.getElementById('cash-balance'),
    accountsReceivable: document.getElementById('accounts-receivable'),
    accountsPayable: document.getElementById('accounts-payable'),
    newExpenseButton: document.getElementById('new-expense-button'),
    
    // Relatórios
    reportsFilterProduct: document.getElementById('reports-filter-product'),
    reportsFilterIdentifier: document.getElementById('reports-filter-identifier'),
    reportsFilterDateStart: document.getElementById('reports-filter-date-start'),
    reportsFilterDateEnd: document.getElementById('reports-filter-date-end'),
    generateSalesReport: document.getElementById('generate-sales-report'),
    generateStockReport: document.getElementById('generate-stock-report'),
    generateFinancialReport: document.getElementById('generate-financial-report'),
    reportsOutput: document.getElementById('reports-output'),
    
    // Modais
    paymentConfirmationModal: document.getElementById('payment-confirmation-modal'),
    manualSaleModal: document.getElementById('manual-sale-modal'),
    customerFormModal: document.getElementById('customer-form-modal'),
    productModelFormModal: document.getElementById('product-model-form-modal'),
    supplierFormModal: document.getElementById('supplier-form-modal'),
    purchaseFormModal: document.getElementById('purchase-form-modal'),
    expenseFormModal: document.getElementById('expense-form-modal'),
    detailsModal: document.getElementById('details-modal'),
    
    // Botões de fechar modais
    closePaymentConfirmationModal: document.getElementById('close-payment-confirmation-modal'),
    closeManualSaleModal: document.getElementById('close-manual-sale-modal'),
    closeCustomerFormModal: document.getElementById('close-customer-form-modal'),
    closeProductModelFormModal: document.getElementById('close-product-model-form-modal'),
    closeSupplierFormModal: document.getElementById('close-supplier-form-modal'),
    closePurchaseFormModal: document.getElementById('close-purchase-form-modal'),
    closeExpenseFormModal: document.getElementById('close-expense-form-modal'),
    closeDetailsModal: document.getElementById('close-details-modal')
};

const UI = {
    switchView(viewToShow) {
        DOM.publicView.classList.toggle('hidden', viewToShow !== 'public');
        DOM.managementPanel.classList.toggle('hidden', viewToShow !== 'management');
        if (viewToShow === 'management') {
            this.switchTab('dashboard');
        }
    },
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const activeContent = document.getElementById(`${tabId}-content`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('border-cyan-400', 'text-white');
            button.classList.add('border-transparent', 'text-gray-300');
        });
        const activeButton = document.querySelector(`button[data-tab="${tabId}"]`);
        if (activeButton) {
            activeButton.classList.remove('border-transparent', 'text-gray-300');
            activeButton.classList.add('border-cyan-400', 'text-white');
        }
    },
    toggleModal(modalElement, show) {
        if (modalElement) {
            modalElement.classList.toggle('hidden', !show);
        }
    },
    showDetailsModal(title, content) {
        document.getElementById('details-modal-title').textContent = title;
        document.getElementById('details-modal-content').innerHTML = content;
        this.toggleModal(DOM.detailsModal, true);
    }
};

const Auth = {
    init() {
        auth.onAuthStateChanged(user => {
            AppState.isAuthenticated = !!user;
            DOM.authButton.textContent = user ? 'Logout' : 'Login';
            DOM.navDashboard.parentElement.classList.toggle('hidden', !user);
            if (user) {
                UI.switchView('management');
                this.loadManagementData();
            } else {
                UI.switchView('public');
                Shop.loadPublicProducts();
            }
        });
    },
    async handleAuthClick() {
        if (auth.currentUser) {
            await auth.signOut();
        } else {
            const email = prompt('Digite o seu e-mail:');
            const password = prompt('Digite a sua senha:');
            if (email && password) {
                try {
                    await auth.signInWithEmailAndPassword(email, password);
                } catch (error) {
                    Utils.showNotification('Erro de login: ' + error.message, 'error');
                }
            }
        }
    },
    loadManagementData() {
        Stock.loadProductModels();
        Suppliers.loadSuppliers();
        Customers.loadCustomers();
        Purchases.loadPurchases();
        Sales.loadSales();
        Sales.loadSalesHistory();
        Finance.loadFinance();
        Dashboard.updateDashboard();
    }
};

const Shop = {
    loadPublicProducts() {
        database.ref('produtos').on('value', snapshot => {
            AppState.products = snapshot.val() || {};
            this.renderPublicProducts();
        });
    },
    renderPublicProducts() {
        const productEntries = Object.entries(AppState.products);
        if (productEntries.length === 0) {
            DOM.productList.innerHTML = '<p class="col-span-full text-center empty-state">Nenhum produto disponível no momento.</p>';
            return;
        }
        DOM.productList.innerHTML = productEntries.map(([id, product]) => {
            const availableCount = product.unidades ? Object.values(product.unidades).filter(unit => unit.status === 'disponivel').length : 0;
            return `
                <div class="product-card fade-in">
                    <img src="${product.imagem || 'https://placehold.co/300x200/1f2937/9ca3af?text=Produto'}" alt="${product.nome}" loading="lazy">
                    <h3>${product.nome}</h3>
                    <p>${product.descricao || 'Sem descrição disponível.'}</p>
                    <p class="price">${Utils.formatCurrency(product.precoVenda || 0)}</p>
                    <p class="text-sm text-gray-400 mb-2">${availableCount} unidade(s) disponível(eis)</p>
                    ${availableCount > 0 ? `<button class="add-to-cart-button w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded" data-id="${id}">Adicionar ao Carrinho</button>` : `<p class="out-of-stock">Esgotado</p>`}
                </div>`;
        }).join('');
    }
};

const Cart = {
    addToCart(productId) {
        const product = AppState.products[productId];
        if (!product) return;
        if (AppState.cart[productId]) {
            AppState.cart[productId].quantity++;
        } else {
            AppState.cart[productId] = { ...product, quantity: 1, id: productId };
        }
        this.updateCartDisplay();
        Utils.showNotification('Produto adicionado ao carrinho!', 'success');
    },
    removeFromCart(productId) {
        if (AppState.cart[productId] && AppState.cart[productId].quantity > 1) {
            AppState.cart[productId].quantity--;
        } else {
            delete AppState.cart[productId];
        }
        this.updateCartDisplay();
    },
    updateCartDisplay() {
        let total = 0;
        let totalItems = 0;
        const cartEntries = Object.entries(AppState.cart);
        DOM.cartItems.innerHTML = cartEntries.length === 0 ? '<p class="empty-state">O seu carrinho está vazio.</p>' : cartEntries.map(([id, item]) => {
            const subtotal = item.quantity * item.precoVenda;
            total += subtotal;
            totalItems += item.quantity;
            return `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.nome}</h4>
                        <p>${item.quantity} x ${Utils.formatCurrency(item.precoVenda)}</p>
                        <p class="text-sm text-gray-400">Subtotal: ${Utils.formatCurrency(subtotal)}</p>
                    </div>
                    <div class="item-actions">
                        <button data-id="${id}" class="remove-from-cart-button bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Remover</button>
                    </div>
                </div>`;
        }).join('');
        DOM.cartTotal.textContent = Utils.formatCurrency(total);
        DOM.checkoutButton.disabled = cartEntries.length === 0;
        if (totalItems > 0) {
            DOM.cartItemCount.textContent = totalItems;
            DOM.cartItemCount.classList.remove('hidden');
        } else {
            DOM.cartItemCount.classList.add('hidden');
        }
    },
    async submitCheckout() {
        const name = DOM.customerName.value.trim();
        const whatsapp = DOM.customerWhatsapp.value.trim();
        if (!Utils.validateForm([DOM.customerName, DOM.customerWhatsapp]) || Object.keys(AppState.cart).length === 0) {
            Utils.showNotification('Por favor, preencha todos os campos e adicione itens ao carrinho.', 'error');
            return;
        }
        try {
            const newCustomerData = {
                nome: name,
                nome_lowercase: name.toLowerCase(),
                whatsapp: whatsapp,
                dataCadastro: new Date().toISOString()
            };
            const newCustomerRef = await database.ref('clientes').push(newCustomerData);
            const customerId = newCustomerRef.key;
            const order = {
                clienteId: customerId,
                cliente: name,
                whatsapp: whatsapp,
                itens: AppState.cart,
                total: Object.values(AppState.cart).reduce((sum, item) => sum + item.quantity * item.precoVenda, 0),
                status: 'pendente',
                data: new Date().toISOString()
            };
            await database.ref('pedidos').push(order);
            Utils.showNotification('Pedido realizado com sucesso! Nossa equipe entrará em contato.', 'success');
            AppState.cart = {};
            this.updateCartDisplay();
            UI.toggleModal(DOM.checkoutModal, false);
            DOM.customerName.value = '';
            DOM.customerWhatsapp.value = '';
        } catch (error) {
            console.error("Erro no checkout:", error);
            Utils.showNotification('Erro ao realizar pedido: ' + error.message, 'error');
        }
    }
};

const Stock = {
    loadProductModels() {
        database.ref('produtos').on('value', snapshot => {
            AppState.products = snapshot.val() || {};
            this.renderStockTable();
        });
    },
    renderStockTable(filteredProducts = null) {
        const products = filteredProducts || AppState.products;
        const productEntries = Object.entries(products);
        if (productEntries.length === 0) {
            DOM.productManagementList.innerHTML = '<p class="empty-state">Nenhum produto encontrado.</p>';
            return;
        }
        const tableRows = productEntries.map(([modelId, product]) => {
            const units = product.unidades || {};
            const availableCount = Object.values(units).filter(u => u.status === 'disponivel').length;
            const soldCount = Object.values(units).filter(u => u.status === 'vendido').length;
            const totalCount = Object.keys(units).length;
            const unitsList = Object.entries(units).map(([identifier, unit]) => `<div class="text-xs p-1 rounded ${unit.status === 'disponivel' ? 'bg-green-800' : 'bg-red-800'}">${identifier} (${unit.status})</div>`).join('');
            return `
                <tr class="clickable-row" data-type="product" data-id="${modelId}">
                    <td><div class="flex items-center"><img src="${product.imagem || 'https://placehold.co/50x50/1f2937/9ca3af?text=P'}" alt="${product.nome}" class="w-12 h-12 object-cover rounded mr-3"><div><div class="font-semibold">${product.nome}</div><div class="text-sm text-gray-400">${product.descricao || 'Sem descrição'}</div></div></div></td>
                    <td>${Utils.formatCurrency(product.precoVenda || 0)}</td>
                    <td><div class="text-center"><div class="text-lg font-bold text-green-400">${availableCount}</div><div class="text-xs text-gray-400">Disponível</div></div></td>
                    <td><div class="text-center"><div class="text-lg font-bold text-red-400">${soldCount}</div><div class="text-xs text-gray-400">Vendido</div></div></td>
                    <td><div class="text-center"><div class="text-lg font-bold">${totalCount}</div><div class="text-xs text-gray-400">Total</div></div></td>
                    <td><div class="flex flex-wrap gap-1 max-w-xs">${unitsList || '<span class="text-gray-400 text-xs">Nenhuma unidade</span>'}</div></td>
                    <td><div class="flex gap-1"><button class="edit-product-model-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${modelId}">Editar</button><button class="delete-product-model-button bg-red-600 text-white text-xs px-2 py-1 rounded" data-id="${modelId}">Excluir</button></div></td>
                </tr>`;
        }).join('');
        DOM.productManagementList.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Produto</th><th>Preço</th><th>Disponível</th><th>Vendido</th><th>Total</th><th>Identificadores</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    applyFilters() {
        const productFilter = DOM.stockFilterProduct.value.toLowerCase().trim();
        const identifierFilter = DOM.stockFilterIdentifier.value.toLowerCase().trim();
        if (!productFilter && !identifierFilter) {
            this.renderStockTable();
            return;
        }
        const filteredProducts = {};
        for (const [modelId, product] of Object.entries(AppState.products)) {
            let matchProduct = !productFilter || product.nome.toLowerCase().includes(productFilter);
            let matchIdentifier = !identifierFilter;
            if (identifierFilter && product.unidades) {
                for (const identifier of Object.keys(product.unidades)) {
                    if (identifier.toLowerCase().includes(identifierFilter)) {
                        matchIdentifier = true;
                        break;
                    }
                }
            }
            if (matchProduct && matchIdentifier) {
                filteredProducts[modelId] = product;
            }
        }
        this.renderStockTable(filteredProducts);
    },
    async saveProductModel() {
        const id = document.getElementById('product-model-id').value;
        const name = document.getElementById('product-model-name').value.trim();
        const price = parseFloat(document.getElementById('product-model-price').value);
        const description = document.getElementById('product-model-description').value.trim();
        const alertLevel = parseInt(document.getElementById('product-model-alert-level').value) || 0;
        const imageFile = document.getElementById('product-model-image-upload').files[0];
        const identifiers = document.getElementById('product-model-identifiers').value.trim();
        const unitCost = parseFloat(document.getElementById('product-model-unit-cost').value) || 0;

        if (!Utils.validateForm([document.getElementById('product-model-name'), document.getElementById('product-model-price')])) {
            Utils.showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        try {
            let imageUrl = (id && AppState.products[id] && AppState.products[id].imagem) || '';
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) {
                    imageUrl = data.secure_url;
                } else {
                    throw new Error('Erro no upload da imagem');
                }
            }

            const productData = {
                nome: name,
                nome_lowercase: name.toLowerCase(),
                precoVenda: price,
                descricao: description,
                nivelAlertaEstoque: alertLevel,
                imagem: imageUrl,
                dataAtualizacao: new Date().toISOString(),
                unidades: (id && AppState.products[id] && AppState.products[id].unidades) || {}
            };

            const dbRef = id ? database.ref('produtos/' + id) : database.ref('produtos').push();
            const modelId = id || dbRef.key;

            await dbRef.update(productData);

            if (identifiers && unitCost > 0) {
                const identifierList = identifiers.split('\n').map(id => id.trim()).filter(id => id.length > 0);
                const updates = {};
                for (const identifier of identifierList) {
                    updates[`/produtos/${modelId}/unidades/${identifier}`] = {
                        status: 'disponivel',
                        dataEntrada: new Date().toISOString(),
                        custoCompra: unitCost
                    };
                }
                await database.ref().update(updates);
            }

            Utils.showNotification(`Produto ${id ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            UI.toggleModal(DOM.productModelFormModal, false);
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            Utils.showNotification('Erro ao salvar produto: ' + error.message, 'error');
        }
    },
    openNewProductModelModal() {
        document.getElementById('product-model-form-title').textContent = 'Novo Modelo de Produto';
        document.getElementById('product-model-id').value = '';
        document.getElementById('product-model-name').value = '';
        document.getElementById('product-model-price').value = '';
        document.getElementById('product-model-description').value = '';
        document.getElementById('product-model-alert-level').value = '';
        document.getElementById('product-model-image-upload').value = '';
        document.getElementById('product-model-identifiers').value = '';
        document.getElementById('product-model-unit-cost').value = '';
        UI.toggleModal(DOM.productModelFormModal, true);
    },
    openEditProductModelModal(modelId) {
        const product = AppState.products[modelId];
        if (!product) return;
        document.getElementById('product-model-form-title').textContent = 'Editar Modelo de Produto';
        document.getElementById('product-model-id').value = modelId;
        document.getElementById('product-model-name').value = product.nome;
        document.getElementById('product-model-price').value = product.precoVenda;
        document.getElementById('product-model-description').value = product.descricao || '';
        document.getElementById('product-model-alert-level').value = product.nivelAlertaEstoque || '';
        document.getElementById('product-model-image-upload').value = '';
        document.getElementById('product-model-identifiers').value = '';
        document.getElementById('product-model-unit-cost').value = '';
        UI.toggleModal(DOM.productModelFormModal, true);
    },
    async deleteProductModel(modelId) {
        const product = AppState.products[modelId];
        if (!product) return;
        const hasUnits = product.unidades && Object.keys(product.unidades).length > 0;
        const confirmMessage = hasUnits ? `Tem certeza que deseja excluir "${product.nome}"? Isso removerá TODAS as unidades em estoque. Esta ação é irreversível.` : `Tem certeza que deseja excluir "${product.nome}"?`;
        if (confirm(confirmMessage)) {
            try {
                await database.ref('produtos/' + modelId).remove();
                Utils.showNotification('Produto excluído com sucesso!', 'success');
            } catch (error) {
                Utils.showNotification('Erro ao excluir produto: ' + error.message, 'error');
            }
        }
    },
    showProductDetails(modelId) {
        const product = AppState.products[modelId];
        if (!product) return;
        const units = product.unidades || {};
        const unitsList = Object.entries(units).map(([identifier, unit]) => `<div class="flex justify-between items-center p-2 rounded ${unit.status === 'disponivel' ? 'bg-green-800' : 'bg-red-800'}"><span class="font-mono">${identifier}</span><span class="text-xs uppercase">${unit.status}</span></div>`).join('');
        const content = `
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <img src="${product.imagem || 'https://placehold.co/100x100/1f2937/9ca3af?text=P'}" alt="${product.nome}" class="w-20 h-20 object-cover rounded">
                    <div><h4 class="text-lg font-semibold">${product.nome}</h4><p class="text-gray-400">${product.descricao || 'Sem descrição'}</p><p class="text-cyan-400 font-bold">${Utils.formatCurrency(product.precoVenda)}</p></div>
                </div>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-gray-700 p-3 rounded"><div class="text-2xl font-bold text-green-400">${Object.values(units).filter(u => u.status === 'disponivel').length}</div><div class="text-sm text-gray-400">Disponível</div></div>
                    <div class="bg-gray-700 p-3 rounded"><div class="text-2xl font-bold text-red-400">${Object.values(units).filter(u => u.status === 'vendido').length}</div><div class="text-sm text-gray-400">Vendido</div></div>
                    <div class="bg-gray-700 p-3 rounded"><div class="text-2xl font-bold text-cyan-400">${Object.keys(units).length}</div><div class="text-sm text-gray-400">Total</div></div>
                </div>
                <div><h5 class="font-semibold mb-2">Identificadores em Estoque:</h5><div class="space-y-1 max-h-40 overflow-y-auto">${unitsList || '<p class="text-gray-400 text-center">Nenhuma unidade em estoque</p>'}</div></div>
                <div class="text-xs text-gray-400"><p>Nível de alerta: ${product.nivelAlertaEstoque || 0} unidades</p><p>Última atualização: ${product.dataAtualizacao ? Utils.formatDate(product.dataAtualizacao) : 'N/A'}</p></div>
            </div>`;
        UI.showDetailsModal(`Detalhes: ${product.nome}`, content);
    }
};

const Sales = {
    loadSales() {
        database.ref('pedidos').orderByChild('status').equalTo('pendente').on('value', snapshot => {
            const orders = snapshot.val() || {};
            window.pendingOrdersData = orders;
            this.renderPendingOrders(orders);
        });
    },
    renderPendingOrders(orders) {
        const orderEntries = Object.entries(orders);
        if (orderEntries.length === 0) {
            DOM.pendingOrders.innerHTML = '<p class="empty-state">Nenhum pedido pendente.</p>';
            return;
        }
        const tableRows = orderEntries.map(([id, order]) => {
            const itemsList = Object.values(order.itens).map(item => `${item.nome} (${item.quantity}x)`).join(', ');
            return `
                <tr class="clickable-row" data-type="order" data-id="${id}">
                    <td>${Utils.formatDate(order.data)}</td>
                    <td>${order.cliente}</td>
                    <td>${order.whatsapp}</td>
                    <td class="text-xs max-w-xs">${itemsList}</td>
                    <td class="font-semibold">${Utils.formatCurrency(order.total)}</td>
                    <td><div class="flex gap-1"><button class="confirm-sale-button bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Confirmar</button><button class="cancel-order-button bg-red-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Cancelar</button></div></td>
                </tr>`;
        }).join('');
        DOM.pendingOrders.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Data</th><th>Cliente</th><th>WhatsApp</th><th>Itens</th><th>Total</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    loadSalesHistory() {
        database.ref('vendas').limitToLast(100).on('value', snapshot => {
            AppState.salesHistory = snapshot.val() || {};
            this.renderSalesHistory();
        });
    },
    renderSalesHistory(filteredSales = null) {
        const sales = filteredSales || AppState.salesHistory;
        const salesEntries = Object.entries(sales).reverse();
        if (salesEntries.length === 0) {
            DOM.salesHistoryList.innerHTML = '<p class="empty-state">Nenhuma venda encontrada.</p>';
            return;
        }
        const tableRows = salesEntries.map(([id, sale]) => {
            const itemsList = Object.values(sale.itens).map(item => `<div class="text-xs p-1 bg-gray-700 rounded mb-1">${item.nome} (S/N: ${item.identifier}) - ${Utils.formatCurrency(item.precoVenda)}</div>`).join('');
            const paymentInfo = sale.pagamento ? `${sale.pagamento.metodo} ${sale.pagamento.parcelas ? `(${sale.pagamento.parcelas}x)` : ''}` : 'N/A';
            return `
                <tr class="clickable-row" data-type="sale" data-id="${id}">
                    <td>${Utils.formatDate(sale.data)}</td>
                    <td>${sale.cliente}</td>
                    <td class="max-w-xs">${itemsList}</td>
                    <td class="font-semibold">${Utils.formatCurrency(sale.total)}</td>
                    <td class="font-semibold text-green-400">${Utils.formatCurrency(sale.lucro || 0)}</td>
                    <td><span class="status-badge status-${sale.status.toLowerCase().replace('í', 'i')}">${sale.status}</span></td>
                </tr>`;
        }).join('');
        DOM.salesHistoryList.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Total</th><th class="text-green-400">Lucro</th><th>Status</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    applySalesHistoryFilter() {
        const productFilter = DOM.salesHistoryFilterProduct.value.toLowerCase().trim();
        const identifierFilter = DOM.salesHistoryFilterIdentifier.value.toLowerCase().trim();
        if (!productFilter && !identifierFilter) {
            this.renderSalesHistory();
            return;
        }
        const filteredSales = {};
        for (const [saleId, sale] of Object.entries(AppState.salesHistory)) {
            let matchFound = false;
            for (const item of Object.values(sale.itens)) {
                const nameMatch = !productFilter || item.nome.toLowerCase().includes(productFilter);
                const identifierMatch = !identifierFilter || item.identifier.toLowerCase().includes(identifierFilter);
                if (nameMatch && identifierMatch) {
                    matchFound = true;
                    break;
                }
            }
            if (matchFound) {
                filteredSales[saleId] = sale;
            }
        }
        this.renderSalesHistory(filteredSales);
    },
    async processSaleConfirmation() {
        if (!AppState.currentOrderToConfirm) {
            Utils.showNotification('Erro: Pedido não encontrado.', 'error');
            return;
        }
        const orderId = AppState.currentOrderToConfirm.id;
        const order = AppState.currentOrderToConfirm;
        const itemElements = document.querySelectorAll('#order-items-to-confirm > div');
        const finalItems = {};
        const updates = {};
        let total = 0;
        let totalCost = 0;

        for (const el of itemElements) {
            const identifierSelect = el.querySelector('.confirm-item-identifier');
            const priceInput = el.querySelector('.confirm-item-price');
            const identifier = identifierSelect.value;
            const modelId = identifierSelect.dataset.modelId;
            const price = parseFloat(priceInput.value);

            if (!identifier || isNaN(price) || price < 0) {
                Utils.showNotification('Todos os itens devem ter um identificador selecionado e um preço válido.', 'error');
                return;
            }
            if (updates[`/produtos/${modelId}/unidades/${identifier}/status`]) {
                Utils.showNotification(`O identificador "${identifier}" foi selecionado mais de uma vez.`, 'error');
                return;
            }

            const cost = AppState.products[modelId]?.unidades[identifier]?.custoCompra || 0;
            updates[`/produtos/${modelId}/unidades/${identifier}/status`] = 'vendido';
            finalItems[identifier] = {
                modelId: modelId,
                identifier: identifier,
                nome: AppState.products[modelId].nome,
                imagem: AppState.products[modelId].imagem,
                precoVenda: price,
                custoCompra: cost
            };
            total += price;
            totalCost += cost;
        }

        const profit = total - totalCost;
        const paymentMethod = document.getElementById('confirm-sale-payment-method').value;
        const installments = parseInt(document.getElementById('confirm-sale-installments').value) || 1;
        const firstDueDate = document.getElementById('confirm-sale-first-due-date').value;
        if (['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(paymentMethod) && !firstDueDate) {
            Utils.showNotification('Para esta forma de pagamento, a data do primeiro vencimento é obrigatória.', 'error');
            return;
        }

        try {
            await database.ref().update(updates);
            const saleData = {
                clienteId: order.clienteId,
                cliente: order.cliente,
                whatsapp: order.whatsapp,
                itens: finalItems,
                total: total,
                lucro: profit,
                data: new Date().toISOString(),
                status: 'Concluída',
                pagamento: {
                    metodo: paymentMethod,
                    parcelas: installments,
                    status: 'A Receber'
                }
            };
            const newSaleRef = await database.ref('vendas').push(saleData);
            const installmentValue = total / installments;
            for (let i = 1; i <= installments; i++) {
                const dueDate = new Date(firstDueDate + 'T12:00:00Z');
                dueDate.setMonth(dueDate.getMonth() + (i - 1));
                await database.ref('contasReceber').push({
                    vendaId: newSaleRef.key,
                    clienteId: order.clienteId,
                    clienteNome: order.cliente,
                    descricao: `Parcela ${i}/${installments} - Venda #${newSaleRef.key.slice(-5)}`,
                    valor: installmentValue,
                    dataVencimento: dueDate.toISOString().split('T')[0],
                    status: 'Pendente'
                });
            }
            await database.ref('pedidos/' + orderId).remove();
            Utils.showNotification('Venda confirmada com sucesso!', 'success');
            UI.toggleModal(DOM.paymentConfirmationModal, false);
            AppState.currentOrderToConfirm = null;
        } catch (error) {
            console.error("Erro ao processar venda:", error);
            Utils.showNotification('Erro ao processar a venda: ' + error.message, 'error');
        }
    },
    async saveManualSale() {
        const customerId = document.getElementById('sale-customer').value;
        const saleDate = document.getElementById('sale-date').value;
        const paymentMethod = document.getElementById('sale-payment-method').value;
        const installments = parseInt(document.getElementById('sale-installments').value) || 1;
        const firstDueDate = document.getElementById('sale-first-due-date').value;
        const customer = AppState.customers[customerId];

        if (!customerId || !saleDate || AppState.currentSaleItems.length === 0) {
            Utils.showNotification('Preencha todos os campos da venda e adicione itens.', 'error');
            return;
        }
        if (['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(paymentMethod) && !firstDueDate) {
            Utils.showNotification('Para esta forma de pagamento, a data do primeiro vencimento é obrigatória.', 'error');
            return;
        }

        const total = AppState.currentSaleItems.reduce((sum, item) => sum + item.price, 0);
        let totalCost = 0;

        try {
            const updates = {};
            const saleItemsForDB = {};
            for (const item of AppState.currentSaleItems) {
                const cost = AppState.products[item.modelId]?.unidades[item.identifier]?.custoCompra || 0;
                updates[`/produtos/${item.modelId}/unidades/${item.identifier}/status`] = 'vendido';
                saleItemsForDB[item.identifier] = {
                    modelId: item.modelId,
                    nome: item.nome,
                    imagem: item.imagem,
                    precoVenda: item.price,
                    identifier: item.identifier,
                    custoCompra: cost
                };
                totalCost += cost;
            }

            const profit = total - totalCost;
            await database.ref().update(updates);

            const saleData = {
                clienteId: customerId,
                cliente: customer.nome,
                whatsapp: customer.whatsapp,
                itens: saleItemsForDB,
                total: total,
                lucro: profit,
                data: new Date(saleDate + 'T12:00:00Z').toISOString(),
                status: 'Concluída',
                pagamento: {
                    metodo: paymentMethod,
                    parcelas: installments,
                    status: 'A Receber'
                }
            };
            const newSaleRef = await database.ref('vendas').push(saleData);
            const installmentValue = total / installments;
            const dueDate = firstDueDate || saleDate;
            for (let i = 1; i <= installments; i++) {
                const installmentDueDate = new Date(dueDate + 'T12:00:00Z');
                installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
                await database.ref('contasReceber').push({
                    vendaId: newSaleRef.key,
                    clienteId: customerId,
                    clienteNome: customer.nome,
                    descricao: `Parcela ${i}/${installments} - Venda #${newSaleRef.key.slice(-5)}`,
                    valor: installmentValue,
                    dataVencimento: installmentDueDate.toISOString().split('T')[0],
                    status: 'Pendente'
                });
            }
            Utils.showNotification('Venda manual gerada com sucesso!', 'success');
            UI.toggleModal(DOM.manualSaleModal, false);
        } catch (error) {
            console.error("Erro ao salvar venda:", error);
            Utils.showNotification('Erro ao salvar venda: ' + error.message, 'error');
        }
    },
    showSaleDetails(saleId) {
        const sale = AppState.salesHistory[saleId];
        if (!sale) return;
        const itemsList = Object.values(sale.itens).map(item => `
            <div class="flex justify-between items-center p-2 bg-gray-700 rounded">
                <div>
                    <div class="font-semibold">${item.nome}</div>
                    <div class="text-sm text-gray-400">S/N: ${item.identifier}</div>
                </div>
                <div class="text-right">
                    <div class="font-semibold">${Utils.formatCurrency(item.precoVenda)}</div>
                    <div class="text-xs text-gray-400">Custo: ${Utils.formatCurrency(item.custoCompra)}</div>
                </div>
            </div>`).join('');
        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><div class="font-semibold">Cliente</div><div class="text-gray-400">${sale.cliente}</div></div>
                    <div><div class="font-semibold">Data</div><div class="text-gray-400">${Utils.formatDate(sale.data)}</div></div>
                </div>
                <div><div class="font-semibold mb-2">Itens Vendidos</div><div class="space-y-2">${itemsList}</div></div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-cyan-800 p-3 rounded text-center">
                        <div class="text-sm font-bold">TOTAL DA VENDA</div>
                        <div class="text-xl font-bold">${Utils.formatCurrency(sale.total)}</div>
                    </div>
                    <div class="bg-green-800 p-3 rounded text-center">
                        <div class="text-sm font-bold">LUCRO DA VENDA</div>
                        <div class="text-xl font-bold">${Utils.formatCurrency(sale.lucro || 0)}</div>
                    </div>
                </div>
            </div>`;
        UI.showDetailsModal(`Venda #${saleId.slice(-5)}`, content);
    },
    // ... (demais funções de Sales) ...
    openPaymentConfirmationModal(orderId) {
        AppState.currentOrderToConfirm = { id: orderId, ...window.pendingOrdersData[orderId] };
        const order = AppState.currentOrderToConfirm;
        const paymentMethodSelect = document.getElementById('confirm-sale-payment-method');
        const installmentFields = document.getElementById('installment-fields');
        const installmentsInput = document.getElementById('confirm-sale-installments');
        const firstDueDateInput = document.getElementById('confirm-sale-first-due-date');
        paymentMethodSelect.value = 'Pix';
        installmentFields.classList.add('hidden');
        installmentsInput.value = 1;
        firstDueDateInput.value = new Date().toISOString().split('T')[0];
        const itemsContainer = document.getElementById('order-items-to-confirm');
        itemsContainer.innerHTML = '';
        let itemIndex = 0;
        for (const [modelId, item] of Object.entries(order.itens)) {
            for (let i = 0; i < item.quantity; i++) {
                const product = AppState.products[item.id];
                const availableUnits = product && product.unidades ? Object.keys(product.unidades).filter(id => product.unidades[id].status === 'disponivel') : [];
                const options = availableUnits.map(uid => `<option value="${uid}">${uid}</option>`).join('');
                const itemHtml = `
                    <div class="p-3 bg-gray-700 rounded" data-item-index="${itemIndex}">
                        <p class="font-semibold">${item.nome} (Unidade ${i + 1})</p>
                        <div class="grid grid-cols-2 gap-4 mt-2">
                            <div><label class="block text-xs mb-1">Identificador (S/N)</label><select class="form-input w-full confirm-item-identifier" data-model-id="${item.id}"><option value="">Selecione...</option>${options}</select></div>
                            <div><label class="block text-xs mb-1">Preço Final (R$)</label><input type="number" step="0.01" class="form-input w-full confirm-item-price" value="${item.precoVenda.toFixed(2)}"></div>
                        </div>
                    </div>`;
                itemsContainer.innerHTML += itemHtml;
                itemIndex++;
            }
        }
        this.updateConfirmationTotal();
        UI.toggleModal(DOM.paymentConfirmationModal, true);
    },
    updateConfirmationTotal() {
        let total = 0;
        document.querySelectorAll('.confirm-item-price').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        document.getElementById('confirm-sale-total').textContent = Utils.formatCurrency(total);
    },
    toggleInstallmentFields() {
        const method = document.getElementById('confirm-sale-payment-method').value;
        const installmentFields = document.getElementById('installment-fields');
        const show = ['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(method);
        installmentFields.classList.toggle('hidden', !show);
    },
    async cancelOrder(orderId) {
        if (confirm('Tem certeza que deseja cancelar este pedido?')) {
            try {
                await database.ref('pedidos/' + orderId).remove();
                Utils.showNotification('Pedido cancelado!', 'success');
            } catch (error) {
                Utils.showNotification('Erro ao cancelar pedido: ' + error.message, 'error');
            }
        }
    },
    openNewSaleModal() {
        const customerSelect = document.getElementById('sale-customer');
        const customerOptions = Object.entries(AppState.customers).map(([id, customer]) => `<option value="${id}">${customer.nome}</option>`).join('');
        customerSelect.innerHTML = '<option value="">Selecione o Cliente</option>' + customerOptions;
        const productSelect = document.getElementById('sale-product-model');
        const productOptions = Object.entries(AppState.products).map(([id, product]) => `<option value="${id}">${product.nome}</option>`).join('');
        productSelect.innerHTML = '<option value="">Selecione o Modelo</option>' + productOptions;
        document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('sale-payment-method').value = 'Pix';
        document.getElementById('sale-installments').value = 1;
        document.getElementById('sale-first-due-date').value = new Date().toISOString().split('T')[0];
        this.toggleManualSaleInstallmentFields();
        AppState.currentSaleItems = [];
        this.updateSaleItemsList();
        UI.toggleModal(DOM.manualSaleModal, true);
    },
    toggleManualSaleInstallmentFields() {
        const method = document.getElementById('sale-payment-method').value;
        const installmentFields = document.getElementById('sale-installment-fields');
        const show = ['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(method);
        installmentFields.classList.toggle('hidden', !show);
    },
    populateSaleIdentifiers() {
        const modelId = document.getElementById('sale-product-model').value;
        const identifierSelect = document.getElementById('sale-product-identifier');
        const priceInput = document.getElementById('sale-price');
        if (!modelId) {
            identifierSelect.innerHTML = '<option value="">Selecione o Modelo primeiro</option>';
            priceInput.value = '';
            return;
        }
        const product = AppState.products[modelId];
        if (!product) return;
        const availableUnits = product.unidades ? Object.keys(product.unidades).filter(id => product.unidades[id].status === 'disponivel' && !AppState.currentSaleItems.some(item => item.identifier === id)) : [];
        const options = availableUnits.map(id => `<option value="${id}">${id}</option>`).join('');
        identifierSelect.innerHTML = options ? '<option value="">Selecione</option>' + options : '<option value="">Sem unidades disponíveis</option>';
        priceInput.value = product.precoVenda.toFixed(2);
    },
    addItemToSale() {
        const modelId = document.getElementById('sale-product-model').value;
        const identifier = document.getElementById('sale-product-identifier').value;
        const price = parseFloat(document.getElementById('sale-price').value);
        if (!modelId || !identifier || isNaN(price) || price < 0) {
            Utils.showNotification('Selecione modelo, identificador e defina um preço válido.', 'error');
            return;
        }
        AppState.currentSaleItems.push({
            modelId: modelId,
            identifier: identifier,
            price: price,
            nome: AppState.products[modelId].nome,
            imagem: AppState.products[modelId].imagem
        });
        this.updateSaleItemsList();
        this.populateSaleIdentifiers();
        Utils.showNotification('Item adicionado à venda!', 'success');
    },
    updateSaleItemsList() {
        let total = 0;
        const itemsList = document.getElementById('sale-items-list');
        itemsList.innerHTML = AppState.currentSaleItems.map((item, index) => {
            total += item.price;
            return `
                <div class="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <span>${item.nome} (S/N: ${item.identifier}) - ${Utils.formatCurrency(item.price)}</span>
                    <button class="text-red-400 hover:text-red-600 remove-sale-item-button" data-index="${index}">&times;</button>
                </div>`;
        }).join('');
        document.getElementById('sale-total').textContent = Utils.formatCurrency(total);
    },
    removeItemFromSale(itemIndex) {
        AppState.currentSaleItems.splice(itemIndex, 1);
        this.updateSaleItemsList();
        this.populateSaleIdentifiers();
    },
    showOrderDetails(orderId) {
        const order = window.pendingOrdersData[orderId];
        if (!order) return;
        const itemsList = Object.values(order.itens).map(item => `<div class="flex justify-between items-center p-2 bg-gray-700 rounded"><div><div class="font-semibold">${item.nome}</div><div class="text-sm text-gray-400">Quantidade: ${item.quantity}</div></div><div class="text-right"><div class="font-semibold">${Utils.formatCurrency(item.precoVenda * item.quantity)}</div><div class="text-sm text-gray-400">${item.quantity}x ${Utils.formatCurrency(item.precoVenda)}</div></div></div>`).join('');
        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><div class="font-semibold">Cliente</div><div class="text-gray-400">${order.cliente}</div><div class="text-sm text-gray-400">${order.whatsapp}</div></div>
                    <div><div class="font-semibold">Data do Pedido</div><div class="text-gray-400">${Utils.formatDate(order.data)}</div><div class="text-sm">Status: <span class="status-badge status-pendente">${order.status}</span></div></div>
                </div>
                <div><div class="font-semibold mb-2">Itens do Pedido</div><div class="space-y-2">${itemsList}</div></div>
                <div class="bg-yellow-800 p-3 rounded text-center"><div class="text-lg font-bold">Total: ${Utils.formatCurrency(order.total)}</div></div>
                <div class="flex gap-2"><button class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded confirm-sale-button" data-id="${orderId}">Confirmar Venda</button><button class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cancel-order-button" data-id="${orderId}">Cancelar Pedido</button></div>
            </div>`;
        UI.showDetailsModal(`Pedido #${orderId.slice(-5)}`, content);
    }
};

// ... (Purchases, Customers, Suppliers, Finance, Dashboard) ...
const Purchases = {
    loadPurchases() {
        database.ref('compras').on('value', snapshot => {
            AppState.purchases = snapshot.val() || {};
            this.renderPurchases(AppState.purchases);
        });
    },
    renderPurchases(purchases) {
        const purchaseEntries = Object.entries(purchases).reverse();
        if (purchaseEntries.length === 0) {
            DOM.purchaseList.innerHTML = '<p class="empty-state">Nenhuma compra registrada.</p>';
            return;
        }
        const tableRows = purchaseEntries.map(([id, purchase]) => {
            const itemsCount = purchase.itens ? purchase.itens.reduce((sum, item) => sum + item.identifiers.length, 0) : 0;
            return `
                <tr class="clickable-row" data-type="purchase" data-id="${id}">
                    <td>${Utils.formatDate(purchase.dataCompra)}</td>
                    <td>${purchase.numeroNota}</td>
                    <td>${purchase.fornecedorNome}</td>
                    <td class="text-center">${itemsCount}</td>
                    <td class="font-semibold">${Utils.formatCurrency(purchase.total)}</td>
                    <td>${purchase.pagamento.metodo}</td>
                    <td><span class="status-badge ${purchase.status === 'Recebido' ? 'status-concluida' : 'status-pendente'}">${purchase.status}</span></td>
                    <td><div class="flex gap-1">${purchase.status === 'Aguardando Recebimento' ? `<button class="confirm-receipt-button bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Receber</button>` : ''}<button class="delete-purchase-button bg-red-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Excluir</button></div></td>
                </tr>`;
        }).join('');
        DOM.purchaseList.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Data</th><th>Nº Nota</th><th>Fornecedor</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    openNewPurchaseModal() {
        const supplierSelect = document.getElementById('purchase-supplier');
        const supplierOptions = Object.entries(AppState.suppliers).map(([id, supplier]) => `<option value="${id}">${supplier.nome}</option>`).join('');
        supplierSelect.innerHTML = '<option value="">Selecione o Fornecedor</option>' + supplierOptions;
        const productSelect = document.getElementById('purchase-product');
        const productOptions = Object.entries(AppState.products).map(([id, product]) => `<option value="${id}">${product.nome}</option>`).join('');
        productSelect.innerHTML = '<option value="">Selecione o Modelo</option>' + productOptions;
        document.getElementById('purchase-invoice-number').value = '';
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('purchase-payment-method').value = 'Boleto';
        document.getElementById('purchase-unit-price').value = '';
        document.getElementById('purchase-identifiers').value = '';
        document.getElementById('purchase-installments').value = 1;
        document.getElementById('purchase-first-due-date').value = new Date().toISOString().split('T')[0];
        AppState.currentPurchaseItems = [];
        this.updatePurchaseItemsList();
        this.togglePaymentDetails();
        UI.toggleModal(DOM.purchaseFormModal, true);
    },
    togglePaymentDetails() {
        const method = document.getElementById('purchase-payment-method').value;
        const paymentFields = document.getElementById('payment-details-fields');
        const show = ['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(method);
        paymentFields.classList.toggle('hidden', !show);
    },
    addItemToPurchase() {
        const productId = document.getElementById('purchase-product').value;
        const unitPrice = parseFloat(document.getElementById('purchase-unit-price').value);
        const identifiersText = document.getElementById('purchase-identifiers').value.trim();
        if (!productId || isNaN(unitPrice) || unitPrice < 0 || !identifiersText) {
            Utils.showNotification('Selecione produto, defina custo unitário e insira identificadores.', 'error');
            return;
        }
        const identifiers = identifiersText.split('\n').filter(id => id.trim()).map(id => id.trim());
        if (identifiers.length === 0) {
            Utils.showNotification('Insira pelo menos um identificador.', 'error');
            return;
        }
        AppState.currentPurchaseItems.push({
            modelId: productId,
            nome: AppState.products[productId].nome,
            unitPrice: unitPrice,
            identifiers: identifiers
        });
        this.updatePurchaseItemsList();
        document.getElementById('purchase-unit-price').value = '';
        document.getElementById('purchase-identifiers').value = '';
        Utils.showNotification('Item adicionado à compra!', 'success');
    },
    updatePurchaseItemsList() {
        let total = 0;
        const itemsList = document.getElementById('purchase-items-list');
        itemsList.innerHTML = AppState.currentPurchaseItems.map((item, index) => {
            const subtotal = item.identifiers.length * item.unitPrice;
            total += subtotal;
            return `
                <div class="p-3 bg-gray-700 rounded">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="font-semibold">${item.nome}</div>
                            <div class="text-sm text-gray-400">${item.identifiers.length} unidade(s) × ${Utils.formatCurrency(item.unitPrice)} = ${Utils.formatCurrency(subtotal)}</div>
                            <div class="text-xs text-gray-400 mt-1">S/N: ${item.identifiers.join(', ')}</div>
                        </div>
                        <button class="text-red-400 hover:text-red-600 remove-purchase-item-button ml-2" data-index="${index}">&times;</button>
                    </div>
                </div>`;
        }).join('');
        document.getElementById('purchase-total').textContent = Utils.formatCurrency(total);
    },
    removeItemFromPurchase(itemIndex) {
        AppState.currentPurchaseItems.splice(itemIndex, 1);
        this.updatePurchaseItemsList();
    },
    async savePurchase() {
        const supplierId = document.getElementById('purchase-supplier').value;
        const invoiceNumber = document.getElementById('purchase-invoice-number').value.trim();
        const purchaseDate = document.getElementById('purchase-date').value;
        const paymentMethod = document.getElementById('purchase-payment-method').value;
        const installments = parseInt(document.getElementById('purchase-installments').value) || 1;
        const firstDueDate = document.getElementById('purchase-first-due-date').value;
        if (!supplierId || !invoiceNumber || !purchaseDate || AppState.currentPurchaseItems.length === 0) {
            Utils.showNotification('Preencha todos os campos da compra e adicione itens.', 'error');
            return;
        }
        if (['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(paymentMethod) && !firstDueDate) {
            Utils.showNotification('Para esta forma de pagamento, a data do primeiro vencimento é obrigatória.', 'error');
            return;
        }
        const total = AppState.currentPurchaseItems.reduce((sum, item) => sum + (item.identifiers.length * item.unitPrice), 0);
        try {
            const purchaseData = {
                fornecedorId: supplierId,
                fornecedorNome: AppState.suppliers[supplierId].nome,
                itens: AppState.currentPurchaseItems,
                total: total,
                status: 'Aguardando Recebimento',
                dataRegistro: new Date().toISOString(),
                numeroNota: invoiceNumber,
                dataCompra: purchaseDate,
                pagamento: {
                    metodo: paymentMethod,
                    parcelas: installments,
                    primeiroVencimento: firstDueDate
                }
            };
            await database.ref('compras').push(purchaseData);
            Utils.showNotification('Compra registrada com sucesso! Aguardando recebimento.', 'success');
            UI.toggleModal(DOM.purchaseFormModal, false);
        } catch (error) {
            console.error("Erro ao salvar compra:", error);
            Utils.showNotification('Erro ao salvar compra: ' + error.message, 'error');
        }
    },
    async confirmPurchaseReceipt(purchaseId) {
        const purchaseRef = database.ref('compras/' + purchaseId);
        try {
            const purchaseSnapshot = await purchaseRef.once('value');
            const purchase = purchaseSnapshot.val();
            if (!purchase) {
                Utils.showNotification('Compra não encontrada.', 'error');
                return;
            }
            if (!confirm('Confirmar o recebimento desta compra? O estoque será atualizado e as contas a pagar serão geradas.')) {
                return;
            }
            const updates = {};
            for (const item of purchase.itens) {
                for (const identifier of item.identifiers) {
                    updates[`/produtos/${item.modelId}/unidades/${identifier}`] = {
                        status: 'disponivel',
                        dataEntrada: new Date().toISOString(),
                        compraId: purchaseId,
                        custoCompra: item.unitPrice
                    };
                }
            }
            await database.ref().update(updates);
            const paymentInfo = purchase.pagamento || {};
            const installments = paymentInfo.parcelas || 1;
            const total = purchase.total;
            const paymentMethod = paymentInfo.metodo;
            if (['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(paymentMethod)) {
                const installmentValue = total / installments;
                const firstDueDate = paymentInfo.primeiroVencimento || purchase.dataCompra;
                for (let i = 1; i <= installments; i++) {
                    const dueDate = new Date(firstDueDate + 'T12:00:00Z');
                    dueDate.setMonth(dueDate.getMonth() + (i - 1));
                    await database.ref('contasPagar').push({
                        compraId: purchaseId,
                        fornecedorId: purchase.fornecedorId,
                        fornecedorNome: purchase.fornecedorNome,
                        descricao: `Parcela ${i}/${installments} - NF #${purchase.numeroNota}`,
                        valor: installmentValue,
                        dataVencimento: dueDate.toISOString().split('T')[0],
                        status: 'Pendente'
                    });
                }
            }
            await purchaseRef.update({ status: 'Recebido', dataRecebimento: new Date().toISOString() });
            Utils.showNotification('Recebimento confirmado! Estoque atualizado e contas a pagar geradas!', 'success');
        } catch (error) {
            console.error("Erro ao confirmar recebimento:", error);
            Utils.showNotification('Erro ao confirmar recebimento: ' + error.message, 'error');
        }
    },
    async deletePurchase(purchaseId) {
        const purchaseRef = database.ref('compras/' + purchaseId);
        try {
            const purchaseSnapshot = await purchaseRef.once('value');
            const purchase = purchaseSnapshot.val();
            if (!purchase) return;
            if (purchase.status === 'Recebido') {
                Utils.showNotification('Não é possível excluir uma compra que já foi recebida.', 'error');
                return;
            }
            if (confirm(`Tem certeza que deseja excluir a compra da NF #${purchase.numeroNota}?`)) {
                await purchaseRef.remove();
                Utils.showNotification('Compra excluída com sucesso!', 'success');
            }
        } catch (error) {
            console.error("Erro ao excluir compra:", error);
            Utils.showNotification('Erro ao excluir compra: ' + error.message, 'error');
        }
    },
    showPurchaseDetails(purchaseId) {
        const purchase = AppState.purchases[purchaseId];
        if (!purchase) return;
        const itemsList = purchase.itens.map(item => `<div class="p-2 bg-gray-700 rounded mb-2"><div class="font-semibold">${item.nome}</div><div class="text-sm text-gray-400">${item.identifiers.length} unidade(s) × ${Utils.formatCurrency(item.unitPrice)} = ${Utils.formatCurrency(item.identifiers.length * item.unitPrice)}</div><div class="text-xs text-gray-400">S/N: ${item.identifiers.join(', ')}</div></div>`).join('');
        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><div class="font-semibold">Fornecedor</div><div class="text-gray-400">${purchase.fornecedorNome}</div></div>
                    <div><div class="font-semibold">Nota Fiscal</div><div class="text-gray-400">#${purchase.numeroNota}</div></div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div><div class="font-semibold">Data da Compra</div><div class="text-gray-400">${Utils.formatDate(purchase.dataCompra)}</div></div>
                    <div><div class="font-semibold">Forma de Pagamento</div><div class="text-gray-400">${purchase.pagamento.metodo} ${purchase.pagamento.parcelas ? `(${purchase.pagamento.parcelas}x)` : ''}</div></div>
                </div>
                <div><div class="font-semibold">Status</div><span class="status-badge ${purchase.status === 'Recebido' ? 'status-concluida' : 'status-pendente'}">${purchase.status}</span></div>
                <div><div class="font-semibold mb-2">Itens Comprados</div><div class="space-y-2">${itemsList}</div></div>
                <div class="bg-cyan-800 p-3 rounded text-center"><div class="text-lg font-bold">Total: ${Utils.formatCurrency(purchase.total)}</div></div>
                ${purchase.status === 'Aguardando Recebimento' ? `<div class="flex gap-2"><button class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded confirm-receipt-button" data-id="${purchaseId}">Confirmar Recebimento</button></div>` : ''}
            </div>`;
        UI.showDetailsModal(`Compra NF #${purchase.numeroNota}`, content);
    }
};

const Customers = {
    loadCustomers() {
        database.ref('clientes').on('value', snapshot => {
            AppState.customers = snapshot.val() || {};
            this.renderCustomers();
        });
    },
    renderCustomers() {
        const customerEntries = Object.entries(AppState.customers);
        if (customerEntries.length === 0) {
            DOM.customerList.innerHTML = '<p class="empty-state">Nenhum cliente cadastrado.</p>';
            return;
        }
        const tableRows = customerEntries.map(([id, customer]) => `
            <tr class="clickable-row" data-type="customer" data-id="${id}">
                <td><div class="font-semibold">${customer.nome}</div><div class="text-sm text-gray-400">${Utils.formatDate(customer.dataCadastro)}</div></td>
                <td>${customer.whatsapp}</td>
                <td>${customer.email || 'N/A'}</td>
                <td class="max-w-xs text-truncate">${customer.observacoes || 'Nenhuma'}</td>
                <td><div class="flex gap-1"><button class="edit-customer-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Editar</button><button class="delete-customer-button bg-red-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Excluir</button></div></td>
            </tr>`).join('');
        DOM.customerList.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Nome</th><th>WhatsApp</th><th>E-mail</th><th>Observações</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    openNewCustomerModal() {
        document.getElementById('customer-form-title').textContent = 'Novo Cliente';
        document.getElementById('customer-id').value = '';
        document.getElementById('new-customer-name').value = '';
        document.getElementById('new-customer-whatsapp').value = '';
        document.getElementById('new-customer-email').value = '';
        document.getElementById('new-customer-notes').value = '';
        UI.toggleModal(DOM.customerFormModal, true);
    },
    openEditCustomerModal(customerId) {
        const customer = AppState.customers[customerId];
        if (!customer) return;
        document.getElementById('customer-form-title').textContent = 'Editar Cliente';
        document.getElementById('customer-id').value = customerId;
        document.getElementById('new-customer-name').value = customer.nome;
        document.getElementById('new-customer-whatsapp').value = customer.whatsapp;
        document.getElementById('new-customer-email').value = customer.email || '';
        document.getElementById('new-customer-notes').value = customer.observacoes || '';
        UI.toggleModal(DOM.customerFormModal, true);
    },
    async saveCustomer() {
        const id = document.getElementById('customer-id').value;
        const name = document.getElementById('new-customer-name').value.trim();
        const whatsapp = document.getElementById('new-customer-whatsapp').value.trim();
        const email = document.getElementById('new-customer-email').value.trim();
        const notes = document.getElementById('new-customer-notes').value.trim();
        if (!Utils.validateForm([document.getElementById('new-customer-name'), document.getElementById('new-customer-whatsapp')])) {
            Utils.showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        try {
            const customerData = {
                nome: name,
                nome_lowercase: name.toLowerCase(),
                whatsapp: whatsapp,
                email: email,
                observacoes: notes,
                dataAtualizacao: new Date().toISOString()
            };
            if (!id) {
                customerData.dataCadastro = new Date().toISOString();
            }
            const dbRef = id ? database.ref('clientes/' + id) : database.ref('clientes').push();
            await dbRef.set(customerData);
            Utils.showNotification(`Cliente ${id ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
            UI.toggleModal(DOM.customerFormModal, false);
        } catch (error) {
            console.error("Erro ao salvar cliente:", error);
            Utils.showNotification('Erro ao salvar cliente: ' + error.message, 'error');
        }
    },
    async deleteCustomer(customerId) {
        const customer = AppState.customers[customerId];
        if (!customer) return;
        if (confirm(`Tem certeza que deseja excluir o cliente "${customer.nome}"?`)) {
            try {
                await database.ref('clientes/' + customerId).remove();
                Utils.showNotification('Cliente excluído com sucesso!', 'success');
            } catch (error) {
                Utils.showNotification('Erro ao excluir cliente: ' + error.message, 'error');
            }
        }
    },
    showCustomerDetails(customerId) {
        const customer = AppState.customers[customerId];
        if (!customer) return;
        database.ref('vendas').orderByChild('clienteId').equalTo(customerId).once('value', snapshot => {
            const sales = snapshot.val() || {};
            const salesList = Object.entries(sales).map(([saleId, sale]) => `<div class="flex justify-between items-center p-2 bg-gray-700 rounded"><div><div class="text-sm">${Utils.formatDate(sale.data)}</div><div class="text-xs text-gray-400">#${saleId.slice(-5)}</div></div><div class="text-right"><div class="font-semibold">${Utils.formatCurrency(sale.total)}</div><div class="text-xs text-gray-400">${sale.pagamento?.metodo || 'N/A'}</div></div></div>`).join('');
            const totalPurchases = Object.values(sales).reduce((sum, sale) => sum + sale.total, 0);
            const content = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><div class="font-semibold">Nome Completo</div><div class="text-gray-400">${customer.nome}</div></div>
                        <div><div class="font-semibold">WhatsApp</div><div class="text-gray-400">${customer.whatsapp}</div></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><div class="font-semibold">E-mail</div><div class="text-gray-400">${customer.email || 'Não informado'}</div></div>
                        <div><div class="font-semibold">Data de Cadastro</div><div class="text-gray-400">${Utils.formatDate(customer.dataCadastro)}</div></div>
                    </div>
                    ${customer.observacoes ? `<div><div class="font-semibold">Observações</div><div class="text-gray-400 bg-gray-700 p-2 rounded">${customer.observacoes}</div></div>` : ''}
                    <div class="bg-cyan-800 p-3 rounded"><div class="text-center"><div class="text-lg font-bold">Total em Compras</div><div class="text-2xl font-bold">${Utils.formatCurrency(totalPurchases)}</div><div class="text-sm text-gray-300">${Object.keys(sales).length} compra(s) realizada(s)</div></div></div>
                    ${Object.keys(sales).length > 0 ? `<div><div class="font-semibold mb-2">Histórico de Compras</div><div class="space-y-2 max-h-40 overflow-y-auto">${salesList}</div></div>` : '<div class="text-center text-gray-400">Nenhuma compra realizada ainda</div>'}
                </div>`;
            UI.showDetailsModal(`Cliente: ${customer.nome}`, content);
        });
    }
};

const Suppliers = {
    loadSuppliers() {
        database.ref('fornecedores').on('value', snapshot => {
            AppState.suppliers = snapshot.val() || {};
            this.renderSuppliers();
        });
    },
    renderSuppliers() {
        const supplierEntries = Object.entries(AppState.suppliers);
        if (supplierEntries.length === 0) {
            DOM.supplierList.innerHTML = '<p class="empty-state">Nenhum fornecedor cadastrado.</p>';
            return;
        }
        const tableRows = supplierEntries.map(([id, supplier]) => `
            <tr class="clickable-row" data-type="supplier" data-id="${id}">
                <td class="font-semibold">${supplier.nome}</td>
                <td>${supplier.contato || 'N/A'}</td>
                <td><div class="flex gap-1"><button class="edit-supplier-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Editar</button><button class="delete-supplier-button bg-red-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Excluir</button></div></td>
            </tr>`).join('');
        DOM.supplierList.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Nome</th><th>Contato</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    openNewSupplierModal() {
        document.getElementById('supplier-form-title').textContent = 'Novo Fornecedor';
        document.getElementById('supplier-id').value = '';
        document.getElementById('supplier-name').value = '';
        document.getElementById('supplier-contact').value = '';
        UI.toggleModal(DOM.supplierFormModal, true);
    },
    openEditSupplierModal(supplierId) {
        const supplier = AppState.suppliers[supplierId];
        if (!supplier) return;
        document.getElementById('supplier-form-title').textContent = 'Editar Fornecedor';
        document.getElementById('supplier-id').value = supplierId;
        document.getElementById('supplier-name').value = supplier.nome;
        document.getElementById('supplier-contact').value = supplier.contato || '';
        UI.toggleModal(DOM.supplierFormModal, true);
    },
    async saveSupplier() {
        const id = document.getElementById('supplier-id').value;
        const name = document.getElementById('supplier-name').value.trim();
        const contact = document.getElementById('supplier-contact').value.trim();
        if (!Utils.validateForm([document.getElementById('supplier-name')])) {
            Utils.showNotification('Por favor, preencha o nome do fornecedor.', 'error');
            return;
        }
        try {
            const supplierData = {
                nome: name,
                contato: contact,
                dataAtualizacao: new Date().toISOString()
            };
            if (!id) {
                supplierData.dataCadastro = new Date().toISOString();
            }
            const dbRef = id ? database.ref('fornecedores/' + id) : database.ref('fornecedores').push();
            await dbRef.set(supplierData);
            Utils.showNotification(`Fornecedor ${id ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
            UI.toggleModal(DOM.supplierFormModal, false);
        } catch (error) {
            console.error("Erro ao salvar fornecedor:", error);
            Utils.showNotification('Erro ao salvar fornecedor: ' + error.message, 'error');
        }
    },
    async deleteSupplier(supplierId) {
        const supplier = AppState.suppliers[supplierId];
        if (!supplier) return;
        if (confirm(`Tem certeza que deseja excluir o fornecedor "${supplier.nome}"?`)) {
            try {
                await database.ref('fornecedores/' + supplierId).remove();
                Utils.showNotification('Fornecedor excluído com sucesso!', 'success');
            } catch (error) {
                Utils.showNotification('Erro ao excluir fornecedor: ' + error.message, 'error');
            }
        }
    },
    showSupplierDetails(supplierId) {
        const supplier = AppState.suppliers[supplierId];
        if (!supplier) return;
        database.ref('compras').orderByChild('fornecedorId').equalTo(supplierId).once('value', snapshot => {
            const purchases = snapshot.val() || {};
            const purchasesList = Object.entries(purchases).map(([purchaseId, purchase]) => `<div class="flex justify-between items-center p-2 bg-gray-700 rounded"><div><div class="text-sm">NF #${purchase.numeroNota}</div><div class="text-xs text-gray-400">${Utils.formatDate(purchase.dataCompra)}</div></div><div class="text-right"><div class="font-semibold">${Utils.formatCurrency(purchase.total)}</div><div class="text-xs text-gray-400">${purchase.status}</div></div></div>`).join('');
            const totalPurchases = Object.values(purchases).reduce((sum, purchase) => sum + purchase.total, 0);
            const content = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><div class="font-semibold">Nome</div><div class="text-gray-400">${supplier.nome}</div></div>
                        <div><div class="font-semibold">Contato</div><div class="text-gray-400">${supplier.contato || 'Não informado'}</div></div>
                    </div>
                    <div class="bg-cyan-800 p-3 rounded"><div class="text-center"><div class="text-lg font-bold">Total em Compras</div><div class="text-2xl font-bold">${Utils.formatCurrency(totalPurchases)}</div><div class="text-sm text-gray-300">${Object.keys(purchases).length} compra(s) realizada(s)</div></div></div>
                    ${Object.keys(purchases).length > 0 ? `<div><div class="font-semibold mb-2">Histórico de Compras</div><div class="space-y-2 max-h-40 overflow-y-auto">${purchasesList}</div></div>` : '<div class="text-center text-gray-400">Nenhuma compra realizada ainda</div>'}
                </div>`;
            UI.showDetailsModal(`Fornecedor: ${supplier.nome}`, content);
        });
    }
};

const Finance = {
    loadFinance() {
        this.loadAccountsReceivable();
        this.loadAccountsPayable();
        this.calculateCashBalance();
    },
    loadAccountsReceivable() {
        database.ref('contasReceber').orderByChild('dataVencimento').on('value', snapshot => {
            AppState.accountsReceivable = snapshot.val() || {};
            this.renderAccountsReceivable(AppState.accountsReceivable);
        });
    },
    loadAccountsPayable() {
        database.ref('contasPagar').orderByChild('dataVencimento').on('value', snapshot => {
            AppState.accountsPayable = snapshot.val() || {};
            this.renderAccountsPayable(AppState.accountsPayable);
        });
    },
    renderAccountsReceivable(accounts) {
        const accountEntries = Object.entries(accounts);
        if (accountEntries.length === 0) {
            DOM.accountsReceivable.innerHTML = '<p class="empty-state">Nenhuma conta a receber.</p>';
            return;
        }
        const tableRows = accountEntries.map(([id, account]) => {
            const isPaid = account.status === 'Recebido';
            const isOverdue = !isPaid && new Date(account.dataVencimento) < new Date();
            return `
                <tr class="clickable-row ${isOverdue ? 'bg-red-900 bg-opacity-20' : ''}" data-type="receivable" data-id="${id}">
                    <td>${Utils.formatDate(account.dataVencimento)}</td>
                    <td>${account.clienteNome || 'N/A'}</td>
                    <td class="max-w-xs text-truncate">${account.descricao}</td>
                    <td class="font-semibold text-green-400">+ ${Utils.formatCurrency(account.valor)}</td>
                    <td><span class="status-badge ${isPaid ? 'status-concluida' : isOverdue ? 'status-cancelada' : 'status-pendente'}">${isPaid ? 'Recebido' : isOverdue ? 'Vencido' : 'Pendente'}</span></td>
                    <td>${!isPaid ? `<button class="confirm-transaction-button bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${id}" data-type="receber">Receber</button>` : `<span class="text-xs text-gray-400">Recebido em ${Utils.formatDate(account.dataRecebimento)}</span>`}</td>
                </tr>`;
        }).join('');
        DOM.accountsReceivable.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Vencimento</th><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    renderAccountsPayable(accounts) {
        const accountEntries = Object.entries(accounts);
        if (accountEntries.length === 0) {
            DOM.accountsPayable.innerHTML = '<p class="empty-state">Nenhuma conta a pagar.</p>';
            return;
        }
        const tableRows = accountEntries.map(([id, account]) => {
            const isPaid = account.status === 'Paga';
            const isOverdue = !isPaid && new Date(account.dataVencimento) < new Date();
            return `
                <tr class="clickable-row ${isOverdue ? 'bg-red-900 bg-opacity-20' : ''}" data-type="payable" data-id="${id}">
                    <td>${Utils.formatDate(account.dataVencimento)}</td>
                    <td>${account.fornecedorNome || account.categoria || 'N/A'}</td>
                    <td class="max-w-xs text-truncate">${account.descricao}</td>
                    <td class="font-semibold text-red-400">- ${Utils.formatCurrency(account.valor)}</td>
                    <td><span class="status-badge ${isPaid ? 'status-concluida' : isOverdue ? 'status-cancelada' : 'status-pendente'}">${isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'Pendente'}</span></td>
                    <td>${!isPaid ? `<button class="confirm-transaction-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${id}" data-type="pagar">Pagar</button>` : `<span class="text-xs text-gray-400">Paga em ${Utils.formatDate(account.dataPagamento)}</span>`}</td>
                </tr>`;
        }).join('');
        DOM.accountsPayable.innerHTML = `
            <table class="w-full text-sm table-responsive">
                <thead><tr><th>Vencimento</th><th>Fornecedor/Categoria</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>`;
    },
    async calculateCashBalance() {
        try {
            const [receivableSnapshot, payableSnapshot] = await Promise.all([database.ref('contasReceber').once('value'), database.ref('contasPagar').once('value')]);
            const receivables = receivableSnapshot.val() || {};
            const payables = payableSnapshot.val() || {};
            const totalReceived = Object.values(receivables).filter(account => account.status === 'Recebido').reduce((sum, account) => sum + account.valor, 0);
            const totalPaid = Object.values(payables).filter(account => account.status === 'Paga').reduce((sum, account) => sum + account.valor, 0);
            const balance = totalReceived - totalPaid;
            DOM.cashBalance.textContent = Utils.formatCurrency(balance);
            DOM.cashBalance.className = balance >= 0 ? 'text-green-400' : 'text-red-400';
            const pendingReceivables = Object.values(receivables).filter(account => account.status === 'Pendente').reduce((sum, account) => sum + account.valor, 0);
            if (DOM.pendingReceivables) {
                DOM.pendingReceivables.textContent = Utils.formatCurrency(pendingReceivables);
            }
        } catch (error) {
            console.error("Erro ao calcular saldo:", error);
        }
    },
    async confirmTransaction(accountId, type) {
        const ref = type === 'receber' ? 'contasReceber' : 'contasPagar';
        const statusField = type === 'receber' ? 'Recebido' : 'Paga';
        const dateField = type === 'receber' ? 'dataRecebimento' : 'dataPagamento';
        try {
            await database.ref(`${ref}/${accountId}`).update({
                status: statusField,
                [dateField]: new Date().toISOString()
            });
            Utils.showNotification(`Transação confirmada com sucesso!`, 'success');
            this.calculateCashBalance();
        } catch (error) {
            console.error("Erro ao confirmar transação:", error);
            Utils.showNotification('Erro ao confirmar transação: ' + error.message, 'error');
        }
    },
    openNewExpenseModal() {
        document.getElementById('expense-description').value = '';
        document.getElementById('expense-value').value = '';
        document.getElementById('expense-due-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-category').value = 'Custo Fixo';
        UI.toggleModal(DOM.expenseFormModal, true);
    },
    async saveExpense() {
        const description = document.getElementById('expense-description').value.trim();
        const value = parseFloat(document.getElementById('expense-value').value);
        const dueDate = document.getElementById('expense-due-date').value;
        const category = document.getElementById('expense-category').value;
        if (!Utils.validateForm([document.getElementById('expense-description'), document.getElementById('expense-value'), document.getElementById('expense-due-date')]) || isNaN(value) || value <= 0) {
            Utils.showNotification('Preencha todos os campos corretamente.', 'error');
            return;
        }
        try {
            const expenseData = {
                descricao: description,
                categoria: category,
                valor: value,
                dataVencimento: dueDate,
                status: 'Pendente',
                dataCriacao: new Date().toISOString()
            };
            await database.ref('contasPagar').push(expenseData);
            Utils.showNotification('Despesa lançada com sucesso!', 'success');
            UI.toggleModal(DOM.expenseFormModal, false);
        } catch (error) {
            console.error("Erro ao salvar despesa:", error);
            Utils.showNotification('Erro ao salvar despesa: ' + error.message, 'error');
        }
    },
    showAccountDetails(accountId, type) {
        const ref = type === 'receivable' ? 'contasReceber' : 'contasPagar';
        database.ref(`${ref}/${accountId}`).once('value', snapshot => {
            const account = snapshot.val();
            if (!account) return;
            const isReceivable = type === 'receivable';
            const isPaid = account.status === (isReceivable ? 'Recebido' : 'Paga');
            const content = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><div class="font-semibold">${isReceivable ? 'Cliente' : 'Fornecedor/Categoria'}</div><div class="text-gray-400">${account.clienteNome || account.fornecedorNome || account.categoria || 'N/A'}</div></div>
                        <div><div class="font-semibold">Data de Vencimento</div><div class="text-gray-400">${Utils.formatDate(account.dataVencimento)}</div></div>
                    </div>
                    <div><div class="font-semibold">Descrição</div><div class="text-gray-400 bg-gray-700 p-2 rounded">${account.descricao}</div></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><div class="font-semibold">Valor</div><div class="text-2xl font-bold ${isReceivable ? 'text-green-400' : 'text-red-400'}">${isReceivable ? '+' : '-'} ${Utils.formatCurrency(account.valor)}</div></div>
                        <div><div class="font-semibold">Status</div><span class="status-badge ${isPaid ? 'status-concluida' : 'status-pendente'}">${account.status}</span></div>
                    </div>
                    ${isPaid ? `<div class="bg-green-800 p-3 rounded"><div class="font-semibold">Data de ${isReceivable ? 'Recebimento' : 'Pagamento'}</div><div class="text-gray-300">${Utils.formatDate(account[isReceivable ? 'dataRecebimento' : 'dataPagamento'])}</div></div>` : `<div class="flex gap-2"><button class="flex-1 ${isReceivable ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded confirm-transaction-button" data-id="${accountId}" data-type="${isReceivable ? 'receber' : 'pagar'}">${isReceivable ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}</button></div>`}
                </div>`;
            UI.showDetailsModal(`${isReceivable ? 'Conta a Receber' : 'Conta a Pagar'} #${accountId.slice(-5)}`, content);
        });
    }
};

const Dashboard = {
    updateDashboard() {
        this.calculateDailySalesAndMonthlyRevenue();
        this.updateStockCount();
        this.checkLowStockAlerts();
    },
    async calculateDailySalesAndMonthlyRevenue() {
        try {
            const salesSnapshot = await database.ref('vendas').once('value');
            const sales = salesSnapshot.val() || {};
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            let dailySales = 0;
            let monthlyRevenue = 0;
            for (const sale of Object.values(sales)) {
                const saleDate = new Date(sale.data);
                if (saleDate >= startOfDay) {
                    dailySales += sale.total;
                }
                if (saleDate >= startOfMonth) {
                    monthlyRevenue += sale.total;
                }
            }
            DOM.dailySales.textContent = Utils.formatCurrency(dailySales);
            DOM.monthlyRevenue.textContent = Utils.formatCurrency(monthlyRevenue);
        } catch (error) {
            console.error("Erro ao calcular vendas:", error);
        }
    },
    updateStockCount() {
        let totalStock = 0;
        for (const product of Object.values(AppState.products)) {
            if (product.unidades) {
                totalStock += Object.values(product.unidades).filter(unit => unit.status === 'disponivel').length;
            }
        }
        if (DOM.totalStock) {
            DOM.totalStock.textContent = totalStock;
        }
    },
    checkLowStockAlerts() {
        const alerts = [];
        for (const [modelId, product] of Object.entries(AppState.products)) {
            const availableCount = product.unidades ? Object.values(product.unidades).filter(unit => unit.status === 'disponivel').length : 0;
            const alertLevel = product.nivelAlertaEstoque || 0;
            if (alertLevel > 0 && availableCount <= alertLevel) {
                alerts.push({
                    nome: product.nome,
                    disponivel: availableCount,
                    alerta: alertLevel
                });
            }
        }
        DOM.lowStockAlerts.innerHTML = alerts.length === 0 ? '<li class="text-green-400">Todos os produtos estão com estoque adequado</li>' : alerts.map(alert => `<li class="text-yellow-400"><strong>${alert.nome}</strong>: ${alert.disponivel} unidade(s) disponível(eis) (alerta: ${alert.alerta})</li>`).join('');
    }
};

const Reports = {
    generateSalesReport() {
        const productFilter = DOM.reportsFilterProduct.value.toLowerCase().trim();
        const identifierFilter = DOM.reportsFilterIdentifier.value.toLowerCase().trim();
        const startDate = DOM.reportsFilterDateStart.value;
        const endDate = DOM.reportsFilterDateEnd.value;
        database.ref('vendas').once('value', snapshot => {
            const sales = snapshot.val() || {};
            let filteredSales = Object.entries(sales);
            if (startDate) {
                filteredSales = filteredSales.filter(([id, sale]) => new Date(sale.data) >= new Date(startDate + 'T00:00:00Z'));
            }
            if (endDate) {
                filteredSales = filteredSales.filter(([id, sale]) => new Date(sale.data) <= new Date(endDate + 'T23:59:59Z'));
            }
            if (productFilter || identifierFilter) {
                filteredSales = filteredSales.filter(([id, sale]) => {
                    for (const item of Object.values(sale.itens)) {
                        const nameMatch = !productFilter || item.nome.toLowerCase().includes(productFilter);
                        const identifierMatch = !identifierFilter || item.identifier.toLowerCase().includes(identifierFilter);
                        if (nameMatch && identifierMatch) return true;
                    }
                    return false;
                });
            }
            const totalSales = filteredSales.length;
            const totalRevenue = filteredSales.reduce((sum, [id, sale]) => sum + sale.total, 0);
            const totalProfit = filteredSales.reduce((sum, [id, sale]) => sum + (sale.lucro || 0), 0);
            const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

            const reportContent = `
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-gray-700 p-4 rounded text-center">
                            <div class="text-2xl font-bold text-cyan-400">${totalSales}</div>
                            <div class="text-sm text-gray-400">Total de Vendas</div>
                        </div>
                        <div class="bg-gray-700 p-4 rounded text-center">
                            <div class="text-2xl font-bold text-yellow-400">${Utils.formatCurrency(averageTicket)}</div>
                            <div class="text-sm text-gray-400">Ticket Médio</div>
                        </div>
                        <div class="bg-gray-700 p-4 rounded text-center">
                            <div class="text-2xl font-bold text-green-400">${Utils.formatCurrency(totalRevenue)}</div>
                            <div class="text-sm text-gray-400">Faturamento Total</div>
                        </div>
                        <div class="bg-gray-700 p-4 rounded text-center">
                            <div class="text-2xl font-bold text-green-400">${Utils.formatCurrency(totalProfit)}</div>
                            <div class="text-sm text-gray-400">Lucro Total</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-3">Detalhes das Vendas</h4>
                        <div class="max-h-60 overflow-y-auto space-y-1">
                            ${filteredSales.map(([id, sale]) => `
                                <div class="text-xs p-2 bg-gray-700 rounded">
                                    <div class="grid grid-cols-4 gap-2">
                                        <span>${Utils.formatDate(sale.data)} - ${sale.cliente}</span>
                                        <span class="font-semibold text-right">Total: ${Utils.formatCurrency(sale.total)}</span>
                                        <span class="font-semibold text-green-400 text-right">Lucro: ${Utils.formatCurrency(sale.lucro || 0)}</span>
                                    </div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>`;
            DOM.reportsOutput.innerHTML = reportContent;
        });
    },
    generateStockReport() {
        // ... (código inalterado)
    },
    generateFinancialReport() {
        // ... (código inalterado)
    }
};

const SystemReset = {
    async resetSystem() {
        if (!confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema (produtos, vendas, clientes, etc.). Esta ação é IRREVERSÍVEL. Tem certeza?')) {
            return;
        }
        if (!confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados serão perdidos permanentemente. Continuar?')) {
            return;
        }
        try {
            const updates = {
                '/produtos': null,
                '/vendas': null,
                '/pedidos': null,
                '/clientes': null,
                '/fornecedores': null,
                '/compras': null,
                '/contasReceber': null,
                '/contasPagar': null
            };
            await database.ref().update(updates);
            Utils.showNotification('Sistema resetado com sucesso!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error("Erro ao resetar sistema:", error);
            Utils.showNotification('Erro ao resetar sistema: ' + error.message, 'error');
        }
    }
};

const EventListeners = {
    init() {
        // Navegação
        DOM.authButton.addEventListener('click', () => Auth.handleAuthClick());
        DOM.navHome.addEventListener('click', () => UI.switchView('public'));
        DOM.navShop.addEventListener('click', () => UI.switchView('public'));
        DOM.navCart.addEventListener('click', () => UI.toggleModal(DOM.cartModal, true));
        DOM.navDashboard.addEventListener('click', () => UI.switchView('management'));

        // Tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => UI.switchTab(button.getAttribute('data-tab')));
        });

        // Carrinho e Checkout
        DOM.closeCartModal.addEventListener('click', () => UI.toggleModal(DOM.cartModal, false));
        DOM.checkoutButton.addEventListener('click', () => {
            UI.toggleModal(DOM.cartModal, false);
            UI.toggleModal(DOM.checkoutModal, true);
        });
        DOM.closeCheckoutModal.addEventListener('click', () => UI.toggleModal(DOM.checkoutModal, false));
        DOM.submitCheckout.addEventListener('click', () => Cart.submitCheckout());

        // Modais - Botões de fechar
        DOM.closePaymentConfirmationModal.addEventListener('click', () => UI.toggleModal(DOM.paymentConfirmationModal, false));
        DOM.closeManualSaleModal.addEventListener('click', () => UI.toggleModal(DOM.manualSaleModal, false));
        DOM.closeCustomerFormModal.addEventListener('click', () => UI.toggleModal(DOM.customerFormModal, false));
        DOM.closeProductModelFormModal.addEventListener('click', () => UI.toggleModal(DOM.productModelFormModal, false));
        DOM.closeSupplierFormModal.addEventListener('click', () => UI.toggleModal(DOM.supplierFormModal, false));
        DOM.closePurchaseFormModal.addEventListener('click', () => UI.toggleModal(DOM.purchaseFormModal, false));
        DOM.closeExpenseFormModal.addEventListener('click', () => UI.toggleModal(DOM.expenseFormModal, false));
        DOM.closeDetailsModal.addEventListener('click', () => UI.toggleModal(DOM.detailsModal, false));

        // Ações do Painel
        DOM.resetSystemButton.addEventListener('click', () => SystemReset.resetSystem());
        DOM.newSaleButton.addEventListener('click', () => Sales.openNewSaleModal());
        DOM.applySalesHistoryFilter.addEventListener('click', () => Sales.applySalesHistoryFilter());
        DOM.addProductModelButton.addEventListener('click', () => Stock.openNewProductModelModal());
        DOM.stockFilterProduct.addEventListener('input', () => Stock.applyFilters());
        DOM.stockFilterIdentifier.addEventListener('input', () => Stock.applyFilters());
        DOM.newPurchaseButton.addEventListener('click', () => Purchases.openNewPurchaseModal());
        DOM.addCustomerButton.addEventListener('click', () => Customers.openNewCustomerModal());
        DOM.addSupplierButton.addEventListener('click', () => Suppliers.openNewSupplierModal());
        DOM.newExpenseButton.addEventListener('click', () => Finance.openNewExpenseModal());

        // Relatórios
        DOM.generateSalesReport.addEventListener('click', () => Reports.generateSalesReport());
        DOM.generateStockReport.addEventListener('click', () => Reports.generateStockReport());
        DOM.generateFinancialReport.addEventListener('click', () => Reports.generateFinancialReport());

        // Formulários - Botões de salvar
        document.getElementById('save-customer-button').addEventListener('click', () => Customers.saveCustomer());
        document.getElementById('save-product-model-button').addEventListener('click', () => Stock.saveProductModel());
        document.getElementById('save-supplier-button').addEventListener('click', () => Suppliers.saveSupplier());
        document.getElementById('save-purchase-button').addEventListener('click', () => Purchases.savePurchase());
        document.getElementById('save-expense-button').addEventListener('click', () => Finance.saveExpense());
        document.getElementById('save-manual-sale-button').addEventListener('click', () => Sales.saveManualSale());

        // Eventos de 'change' e botões específicos de modais
        document.getElementById('confirm-sale-payment-method').addEventListener('change', () => Sales.toggleInstallmentFields());
        document.getElementById('process-sale-confirmation-button').addEventListener('click', () => Sales.processSaleConfirmation());
        document.getElementById('sale-product-model').addEventListener('change', () => Sales.populateSaleIdentifiers());
        document.getElementById('add-item-to-sale-button').addEventListener('click', () => Sales.addItemToSale());
        document.getElementById('sale-payment-method').addEventListener('change', () => Sales.toggleManualSaleInstallmentFields());
        document.getElementById('purchase-payment-method').addEventListener('change', () => Purchases.togglePaymentDetails());
        document.getElementById('add-item-to-purchase-button').addEventListener('click', () => Purchases.addItemToPurchase());
        
        // Event delegation para botões e elementos dinâmicos
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .clickable-row');
            if (!target) return;

            const button = e.target.closest('button');
            if (button) {
                if (button.classList.contains('add-to-cart-button')) Cart.addToCart(button.dataset.id);
                if (button.classList.contains('remove-from-cart-button')) Cart.removeFromCart(button.dataset.id);
                if (button.classList.contains('confirm-sale-button')) Sales.openPaymentConfirmationModal(button.dataset.id);
                if (button.classList.contains('cancel-order-button')) Sales.cancelOrder(button.dataset.id);
                if (button.classList.contains('remove-sale-item-button')) Sales.removeItemFromSale(parseInt(button.dataset.index));
                if (button.classList.contains('edit-product-model-button')) Stock.openEditProductModelModal(button.dataset.id);
                if (button.classList.contains('delete-product-model-button')) Stock.deleteProductModel(button.dataset.id);
                if (button.classList.contains('confirm-receipt-button')) Purchases.confirmPurchaseReceipt(button.dataset.id);
                if (button.classList.contains('delete-purchase-button')) Purchases.deletePurchase(button.dataset.id);
                if (button.classList.contains('remove-purchase-item-button')) Purchases.removeItemFromPurchase(parseInt(button.dataset.index));
                if (button.classList.contains('edit-customer-button')) Customers.openEditCustomerModal(button.dataset.id);
                if (button.classList.contains('delete-customer-button')) Customers.deleteCustomer(button.dataset.id);
                if (button.classList.contains('edit-supplier-button')) Suppliers.openEditSupplierModal(button.dataset.id);
                if (button.classList.contains('delete-supplier-button')) Suppliers.deleteSupplier(button.dataset.id);
                if (button.classList.contains('confirm-transaction-button')) Finance.confirmTransaction(button.dataset.id, button.dataset.type);
            }

            const row = e.target.closest('.clickable-row');
            if (row && !(e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
                const { type, id } = row.dataset;
                switch (type) {
                    case 'product': Stock.showProductDetails(id); break;
                    case 'sale': Sales.showSaleDetails(id); break;
                    case 'order': Sales.showOrderDetails(id); break;
                    case 'purchase': Purchases.showPurchaseDetails(id); break;
                    case 'customer': Customers.showCustomerDetails(id); break;
                    case 'supplier': Suppliers.showSupplierDetails(id); break;
                    case 'receivable': Finance.showAccountDetails(id, 'receivable'); break;
                    case 'payable': Finance.showAccountDetails(id, 'payable'); break;
                }
            }
        });

        // Event delegation para inputs dinâmicos
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('confirm-item-price')) {
                Sales.updateConfirmationTotal();
            }
        });

        // Fechar modais
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                e.target.classList.add('hidden');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    EventListeners.init();
    Shop.loadPublicProducts();
    console.log('Techmess ERP v4.3 - Sistema Profissional de Gestão inicializado com sucesso!');
});

window.TechmessERP = {
    Auth,
    Shop,
    Cart,
    Stock,
    Sales,
    Purchases,
    Customers,
    Suppliers,
    Finance,
    Dashboard,
    Reports,
    Utils,
    UI
};
