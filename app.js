/**
 * Techmess ERP - app.js
 * Senior Software Developer: Parceiro de Programacao
 * Description: Core logic for the Techmess ERP & E-commerce SPA.
 * Handles Firebase integration, UI manipulation, and business logic for all modules.
 * VERSION 2.0 - With unique identifiers and price editing.
 */

// --- CONFIGURAÇÃO E INICIALIZAÇÃO ---
const firebaseConfig = {
    apiKey: "AIzaSyARb-0QE9QcYD2OjkCsOj0pmKTgkJQRlSg",
    authDomain: "vipcell-gestor.firebaseapp.com",
    databaseURL: "https://vipcell-gestor-default-rtdb.firebaseio.com",
    projectId: "vipcell-gestor",
    storageBucket: "vipcell-gestor.firebasestorage.app",
    messagingSenderId: "259960306679",
    appId: "1:259960306679:web:ad7a41cd1842862f7f8cf2"
};


const CLOUDINARY_CLOUD_NAME = 'dmuvm1o6m';
const CLOUDINARY_UPLOAD_PRESET = 'poh3ej4m';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let cart = {};
let products = {}; // Agora armazena modelos de produtos
let suppliers = {};
let customers = {};
let currentPurchaseItems = []; // Alterado para array para suportar múltiplos identificadores por item
let currentSaleItems = []; // Alterado para array
let currentOrderToConfirm = null;
let salesHistory = {}; // Cache para o histórico de vendas para filtragem

// --- SELETORES DE ELEMENTOS DO DOM (CACHE) ---
const getElem = (id) => document.getElementById(id);
const querySel = (selector) => document.querySelector(selector);
const querySelAll = (selector) => document.querySelectorAll(selector);

const ui = {
    publicView: getElem('public-view'),
    managementPanel: getElem('management-panel'),
    authButton: getElem('auth-button'),
    nav: {
        home: getElem('nav-home'),
        shop: getElem('nav-shop'),
        cart: getElem('nav-cart'),
        dashboard: getElem('nav-dashboard'),
        cartItemCount: getElem('cart-item-count')
    },
    shop: {
        productList: getElem('product-list')
    },
    cart: {
        modal: getElem('cart-modal'),
        closeButton: getElem('close-cart-modal'),
        items: getElem('cart-items'),
        total: getElem('cart-total'),
        checkoutButton: getElem('checkout-button')
    },
    checkout: {
        modal: getElem('checkout-modal'),
        closeButton: getElem('close-checkout-modal'),
        nameInput: getElem('customer-name'),
        whatsappInput: getElem('customer-whatsapp'),
        submitButton: getElem('submit-checkout')
    },
    paymentConfirmationModal: {
        modal: getElem('payment-confirmation-modal'),
        closeButton: getElem('close-payment-confirmation-modal'),
        processButton: getElem('process-sale-confirmation-button'),
        orderIdInput: getElem('confirm-sale-order-id'),
        paymentMethodSelect: getElem('confirm-sale-payment-method'),
        installmentFields: getElem('installment-fields'),
        installmentsInput: getElem('confirm-sale-installments'),
        firstDueDateInput: getElem('confirm-sale-first-due-date'),
        itemsContainer: getElem('order-items-to-confirm'),
        total: getElem('confirm-sale-total')
    },
    expenseModal: {
        modal: getElem('expense-form-modal'),
        closeButton: getElem('close-expense-form-modal'),
        saveButton: getElem('save-expense-button'),
        descriptionInput: getElem('expense-description'),
        valueInput: getElem('expense-value'),
        dueDateInput: getElem('expense-due-date'),
        categorySelect: getElem('expense-category'),
    },
    erp: {
        tabs: querySelAll('.tab-button'),
        contents: querySelAll('.tab-content'),
        dashboard: {
            content: getElem('dashboard-content'),
            monthlyRevenue: getElem('monthly-revenue'),
            dailySales: getElem('daily-sales'),
            lowStockAlerts: getElem('low-stock-alerts'),
            resetSystemButton: getElem('reset-system-button')
        },
        sales: {
            content: getElem('sales-content'),
            pendingOrders: getElem('pending-orders'),
            historyList: getElem('sales-history-list'),
            newSaleButton: getElem('new-sale-button'),
            manualSaleModal: getElem('manual-sale-modal'),
            closeManualSaleModal: getElem('close-manual-sale-modal'),
            saveManualSaleButton: getElem('save-manual-sale-button'),
            customerSelect: getElem('sale-customer'),
            productModelSelect: getElem('sale-product-model'),
            productIdentifierSelect: getElem('sale-product-identifier'),
            priceInput: getElem('sale-price'),
            addItemButton: getElem('add-item-to-sale-button'),
            itemsList: getElem('sale-items-list'),
            total: getElem('sale-total'),
            dateInput: getElem('sale-date'),
            paymentMethodSelect: getElem('sale-payment-method'),
            historyFilterProduct: getElem('sales-history-filter-product'),
            historyFilterIdentifier: getElem('sales-history-filter-identifier'),
            applyHistoryFilterButton: getElem('apply-sales-history-filter'),
        },
        customers: {
            content: getElem('customers-content'),
            addButton: getElem('add-customer-button'),
            list: getElem('customer-list'),
            modal: getElem('customer-form-modal'),
            closeModalButton: getElem('close-customer-form-modal'),
            saveButton: getElem('save-customer-button'),
            title: getElem('customer-form-title'),
            idInput: getElem('customer-id'),
            nameInput: getElem('new-customer-name'),
            whatsappInput: getElem('new-customer-whatsapp'),
            emailInput: getElem('new-customer-email'),
            notesInput: getElem('new-customer-notes')
        },
        purchases: {
            content: getElem('purchases-content'),
            newButton: getElem('new-purchase-button'),
            list: getElem('purchase-list'),
            modal: getElem('purchase-form-modal'),
            closeModalButton: getElem('close-purchase-form-modal'),
            saveButton: getElem('save-purchase-button'),
            supplierSelect: getElem('purchase-supplier'),
            productSelect: getElem('purchase-product'),
            priceInput: getElem('purchase-unit-price'),
            identifiersTextarea: getElem('purchase-identifiers'),
            addItemButton: getElem('add-item-to-purchase-button'),
            itemsList: getElem('purchase-items-list'),
            total: getElem('purchase-total'),
            invoiceInput: getElem('purchase-invoice-number'),
            dateInput: getElem('purchase-date'),
            paymentMethodSelect: getElem('purchase-payment-method')
        },
        stock: {
            content: getElem('stock-content'),
            addModelButton: getElem('add-product-model-button'),
            list: getElem('product-management-list'),
            modal: getElem('product-model-form-modal'),
            closeModalButton: getElem('close-product-model-form-modal'),
            saveButton: getElem('save-product-model-button'),
            title: getElem('product-model-form-title'),
            idInput: getElem('product-model-id'),
            nameInput: getElem('product-model-name'),
            priceInput: getElem('product-model-price'),
            descriptionInput: getElem('product-model-description'),
            alertLevelInput: getElem('product-model-alert-level'),
            imageUploadInput: getElem('product-model-image-upload'),
            filterProduct: getElem('stock-filter-product'),
            filterIdentifier: getElem('stock-filter-identifier'),
        },
        finance: {
            content: getElem('finance-content'),
            cashBalance: getElem('cash-balance'),
            accountsReceivable: getElem('accounts-receivable'),
            accountsPayable: getElem('accounts-payable'),
            newExpenseButton: getElem('new-expense-button'),
        },
        suppliers: {
            content: getElem('suppliers-content'),
            addButton: getElem('add-supplier-button'),
            list: getElem('supplier-list'),
            modal: getElem('supplier-form-modal'),
            closeModalButton: getElem('close-supplier-form-modal'),
            saveButton: getElem('save-supplier-button'),
            title: getElem('supplier-form-title'),
            idInput: getElem('supplier-id'),
            nameInput: getElem('supplier-name'),
            contactInput: getElem('supplier-contact')
        }
    }
};

// --- FUNÇÕES DE UI ---

function switchView(viewToShow) {
    ui.publicView.classList.toggle('hidden', viewToShow !== 'public');
    ui.managementPanel.classList.toggle('hidden', viewToShow !== 'management');
    if (viewToShow === 'management') {
        switchTab('dashboard');
    }
}

function switchTab(tabId) {
    ui.erp.contents.forEach(content => content.classList.add('hidden'));
    getElem(`${tabId}-content`).classList.remove('hidden');

    ui.erp.tabs.forEach(button => {
        button.classList.remove('border-cyan-400', 'text-white');
        button.classList.add('border-transparent', 'text-gray-300');
    });
    const activeButton = querySel(`button[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.remove('border-transparent', 'text-gray-300');
        activeButton.classList.add('border-cyan-400', 'text-white');
    }
}

function toggleModal(modalElement, show) {
    if (modalElement) {
        modalElement.classList.toggle('hidden', !show);
    }
}

// --- AUTENTICAÇÃO E INICIALIZAÇÃO DO PAINEL ---

auth.onAuthStateChanged(user => {
    const isLoggedIn = !!user;
    ui.authButton.textContent = isLoggedIn ? 'Logout' : 'Login';
    ui.nav.dashboard.parentElement.classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn) {
        switchView('management');
        loadStockManagement(); 
        loadSupplierManagement();
        loadCustomerManagement();
        loadPurchases();
        loadSales();
        loadSalesHistory();
        loadFinance();
        calculateDailySalesAndMonthlyRevenue();
    } else {
        switchView('public');
    }
});

function handleAuthClick() {
    if (auth.currentUser) {
        auth.signOut();
    } else {
        const email = prompt('Digite o seu e-mail:');
        const password = prompt('Digite a sua senha:');
        if (email && password) {
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => alert('Erro de login: ' + error.message));
        }
    }
}

// --- MÓDULO: VITRINE PÚBLICA (E-COMMERCE) ---
function loadPublicProducts() {
    database.ref('estoque').on('value', snapshot => {
        products = snapshot.val() || {};
        const productEntries = Object.entries(products);
        ui.shop.productList.innerHTML = productEntries.length === 0 
            ? '<p class="col-span-full text-center">Nenhum produto disponível no momento.</p>'
            : productEntries.map(([id, p]) => {
                const availableUnits = p.unidades ? Object.values(p.unidades).filter(u => u.status === 'disponivel').length : 0;
                return `
                <div class="product-card">
                    <img src="${p.imagem || 'https://placehold.co/300x200/1f2937/9ca3af?text=Produto'}" alt="${p.nome}">
                    <h3>${p.nome}</h3>
                    <p>${p.descricao || 'Sem descrição.'}</p>
                    <p class="price">R$ ${(p.precoVenda || 0).toFixed(2).replace('.', ',')}</p>
                    ${availableUnits > 0
                        ? `<button class="add-to-cart-button w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded" data-id="${id}">Adicionar ao Carrinho</button>`
                        : `<p class="out-of-stock">Esgotado</p>`
                    }
                </div>`;
            }).join('');
    });
}

function addToCart(productId) {
    if (cart[productId]) {
        cart[productId].quantity++;
    } else {
        cart[productId] = { ...products[productId], quantity: 1, id: productId };
    }
    updateCartDisplay();
}

function removeFromCart(productId) {
    if (cart[productId] && cart[productId].quantity > 1) {
        cart[productId].quantity--;
    } else {
        delete cart[productId];
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    let total = 0;
    let totalItems = 0;
    const cartEntries = Object.entries(cart);

    ui.cart.items.innerHTML = cartEntries.length === 0
        ? '<p>O seu carrinho está vazio.</p>'
        : cartEntries.map(([id, item]) => {
            total += item.quantity * item.precoVenda;
            totalItems += item.quantity;
            return `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.nome}</h4>
                        <p>${item.quantity} x R$ ${item.precoVenda.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div class="item-actions">
                        <button data-id="${id}" class="remove-from-cart-button bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Remover</button>
                    </div>
                </div>
            `;
        }).join('');
        
    ui.cart.total.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    ui.cart.checkoutButton.disabled = cartEntries.length === 0;

    if (totalItems > 0) {
        ui.nav.cartItemCount.textContent = totalItems;
        ui.nav.cartItemCount.classList.remove('hidden');
    } else {
        ui.nav.cartItemCount.classList.add('hidden');
    }
}

async function submitCheckout() {
    const name = ui.checkout.nameInput.value.trim();
    const whatsapp = ui.checkout.whatsappInput.value.trim();

    if (!name || !whatsapp || Object.keys(cart).length === 0) {
        alert('Por favor, preencha todos os campos e adicione itens ao carrinho.');
        return;
    }

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
        itens: cart,
        total: Object.values(cart).reduce((sum, item) => sum + item.quantity * item.precoVenda, 0),
        status: 'pendente',
        data: new Date().toISOString()
    };

    database.ref('pedidos').push(order).then(() => {
        alert('Pedido realizado com sucesso! Nossa equipe entrará em contato.');
        cart = {};
        updateCartDisplay();
        toggleModal(ui.checkout.modal, false);
        ui.checkout.nameInput.value = '';
        ui.checkout.whatsappInput.value = '';
    }).catch(error => {
        console.error("Erro no checkout:", error);
        alert('Erro ao realizar pedido: ' + error.message);
    });
}

// --- MÓDULO: CLIENTES (CRM) ---
function openNewCustomerModal() {
    ui.erp.customers.title.textContent = 'Adicionar Novo Cliente';
    ui.erp.customers.idInput.value = '';
    ui.erp.customers.nameInput.value = '';
    ui.erp.customers.whatsappInput.value = '';
    ui.erp.customers.emailInput.value = '';
    ui.erp.customers.notesInput.value = '';
    toggleModal(ui.erp.customers.modal, true);
}

function openEditCustomerModal(customerId) {
    const customer = customers[customerId];
    if (customer) {
        ui.erp.customers.title.textContent = 'Editar Cliente';
        ui.erp.customers.idInput.value = customerId;
        ui.erp.customers.nameInput.value = customer.nome;
        ui.erp.customers.whatsappInput.value = customer.whatsapp;
        ui.erp.customers.emailInput.value = customer.email || '';
        ui.erp.customers.notesInput.value = customer.observacoes || '';
        toggleModal(ui.erp.customers.modal, true);
    }
}

function saveCustomer() {
    const id = ui.erp.customers.idInput.value;
    const name = ui.erp.customers.nameInput.value.trim();
    const whatsapp = ui.erp.customers.whatsappInput.value.trim();
    const email = ui.erp.customers.emailInput.value.trim();
    const notes = ui.erp.customers.notesInput.value.trim();

    if (!name || !whatsapp) {
        alert('Nome e WhatsApp são obrigatórios.');
        return;
    }

    const customerData = {
        nome: name,
        nome_lowercase: name.toLowerCase(),
        whatsapp: whatsapp,
        email: email,
        observacoes: notes,
        dataCadastro: new Date().toISOString()
    };
    
    const dbRef = id ? database.ref('clientes/' + id) : database.ref('clientes').push();
    dbRef.set(customerData).then(() => {
        alert(`Cliente ${id ? 'atualizado' : 'salvo'} com sucesso!`);
        toggleModal(ui.erp.customers.modal, false);
    }).catch(error => alert(`Erro ao salvar cliente: ${error.message}`));
}

function deleteCustomer(customerId) {
    if (confirm('Tem a certeza de que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
        database.ref('clientes/' + customerId).remove()
            .then(() => alert('Cliente excluído com sucesso!'))
            .catch(error => alert('Erro ao excluir cliente: ' + error.message));
    }
}

function loadCustomerManagement() {
    database.ref('clientes').on('value', snapshot => {
        customers = snapshot.val() || {};
        const tableBody = Object.entries(customers).map(([id, c]) => `
            <tr>
                <td>${c.nome}</td>
                <td>${c.whatsapp}</td>
                <td>${c.email || 'N/A'}</td>
                <td>
                    <button class="edit-customer-button bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded" data-id="${id}">Editar</button>
                    <button class="delete-customer-button bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded ml-2" data-id="${id}">Excluir</button>
                </td>
            </tr>
        `).join('');

        ui.erp.customers.list.innerHTML = `
            <table class="w-full text-sm">
                <thead><tr><th>Nome</th><th>WhatsApp</th><th>E-mail</th><th>Ações</th></tr></thead>
                <tbody>${tableBody || '<tr><td colspan="4" class="text-center">Nenhum cliente cadastrado.</td></tr>'}</tbody>
            </table>
        `;
    });
}

// --- MÓDULO: VENDAS (ERP) ---
function openNewSaleModal() {
    if (Object.keys(customers).length === 0 || Object.keys(products).length === 0) {
        alert("É necessário ter pelo menos um cliente e um produto cadastrado para gerar uma venda.");
        return;
    }
    
    const customerOptions = Object.entries(customers).map(([id, c]) => `<option value="${id}">${c.nome}</option>`).join('');
    ui.erp.sales.customerSelect.innerHTML = `<option value="">Selecione um Cliente</option>${customerOptions}`;

    const productModelOptions = Object.entries(products)
        .filter(([id, p]) => p.unidades && Object.values(p.unidades).some(u => u.status === 'disponivel'))
        .map(([id, p]) => `<option value="${id}">${p.nome}</option>`).join('');
    ui.erp.sales.productModelSelect.innerHTML = `<option value="">Selecione um Modelo</option>${productModelOptions}`;

    ui.erp.sales.productIdentifierSelect.innerHTML = '';
    ui.erp.sales.priceInput.value = '';
    ui.erp.sales.dateInput.value = new Date().toISOString().split('T')[0];
    
    currentSaleItems = [];
    updateSaleItemsList();
    toggleModal(ui.erp.sales.manualSaleModal, true);
}

function populateSaleIdentifiers() {
    const modelId = ui.erp.sales.productModelSelect.value;
    const identifierSelect = ui.erp.sales.productIdentifierSelect;
    const priceInput = ui.erp.sales.priceInput;

    identifierSelect.innerHTML = '<option value="">Carregando...</option>';
    priceInput.value = '';

    if (!modelId) {
        identifierSelect.innerHTML = '';
        return;
    }

    const product = products[modelId];
    const availableUnits = product.unidades ? Object.keys(product.unidades).filter(id => product.unidades[id].status === 'disponivel') : [];
    
    const alreadyAdded = currentSaleItems.map(item => item.identifier);
    const options = availableUnits
        .filter(id => !alreadyAdded.includes(id))
        .map(id => `<option value="${id}">${id}</option>`).join('');

    identifierSelect.innerHTML = options ? `<option value="">Selecione</option>${options}` : '<option value="">Sem unidades</option>';
    priceInput.value = product.precoVenda.toFixed(2);
}

function addItemToSale() {
    const modelId = ui.erp.sales.productModelSelect.value;
    const identifier = ui.erp.sales.productIdentifierSelect.value;
    const price = parseFloat(ui.erp.sales.priceInput.value);

    if (!modelId || !identifier || isNaN(price) || price < 0) {
        alert("Selecione modelo, identificador e defina um preço válido.");
        return;
    }

    currentSaleItems.push({
        modelId: modelId,
        identifier: identifier,
        price: price,
        nome: products[modelId].nome,
        imagem: products[modelId].imagem
    });
    updateSaleItemsList();
    populateSaleIdentifiers(); // Atualiza a lista de identificadores disponíveis
}

function updateSaleItemsList() {
    let total = 0;
    ui.erp.sales.itemsList.innerHTML = currentSaleItems.map((item, index) => {
        total += item.price;
        return `<div class="flex justify-between items-center p-2 bg-gray-700 rounded mb-1">
                    <span>${item.nome} (S/N: ${item.identifier}) - R$ ${item.price.toFixed(2)}</span>
                    <button class="text-red-400 hover:text-red-600 remove-sale-item-button" data-index="${index}">&times;</button>
                </div>`;
    }).join('');
    ui.erp.sales.total.textContent = `R$ ${total.toFixed(2)}`;
}

function removeItemFromSale(itemIndex) {
    currentSaleItems.splice(itemIndex, 1);
    updateSaleItemsList();
    populateSaleIdentifiers();
}

async function saveManualSale() {
    const customerId = ui.erp.sales.customerSelect.value;
    const saleDate = ui.erp.sales.dateInput.value;
    const paymentMethod = ui.erp.sales.paymentMethodSelect.value;
    const customer = customers[customerId];

    if (!customerId || !saleDate || currentSaleItems.length === 0) {
        alert("Preencha todos os campos da venda (cliente, data) e adicione itens.");
        return;
    }

    const total = currentSaleItems.reduce((sum, item) => sum + item.price, 0);

    const updates = {};
    const saleItemsForDB = {};
    for (const item of currentSaleItems) {
        updates[`/estoque/${item.modelId}/unidades/${item.identifier}/status`] = 'vendido';
        saleItemsForDB[item.identifier] = {
            modelId: item.modelId,
            nome: item.nome,
            imagem: item.imagem,
            precoVenda: item.price,
            identifier: item.identifier
        };
    }
    
    try {
        await database.ref().update(updates);
        
        const saleData = {
            clienteId: customerId,
            cliente: customer.nome,
            whatsapp: customer.whatsapp,
            itens: saleItemsForDB,
            total: total,
            data: new Date(saleDate + 'T12:00:00Z').toISOString(),
            status: 'Concluída',
            pagamento: {
                metodo: paymentMethod,
                status: 'Pendente' // Manual sales might need confirmation or direct entry
            }
        };
        const newSaleRef = await database.ref('vendas').push(saleData);

        await database.ref('contasReceber').push({
            vendaId: newSaleRef.key,
            clienteId: customerId,
            clienteNome: customer.nome,
            descricao: `Venda Manual #${newSaleRef.key.slice(-5)}`,
            valor: total,
            dataVencimento: saleDate,
            status: 'Pendente'
        });
        
        alert("Venda manual gerada com sucesso!");
        toggleModal(ui.erp.sales.manualSaleModal, false);
    } catch(error) {
        alert('Erro ao salvar venda: ' + error.message);
    }
}


function loadSales() {
    database.ref('pedidos').orderByChild('status').equalTo('pendente').on('value', snapshot => {
        const orders = snapshot.val() || {};
        window.pendingOrdersData = orders;
        const tableBody = Object.entries(orders).map(([id, order]) => {
            const itemsList = Object.values(order.itens).map(item => `${item.nome} (${item.quantity})`).join(', ');
            return `
                <tr>
                    <td>${new Date(order.data).toLocaleDateString()}</td>
                    <td>${order.cliente}</td>
                    <td>${order.whatsapp}</td>
                    <td class="text-xs">${itemsList}</td>
                    <td>R$ ${order.total.toFixed(2).replace('.',',')}</td>
                    <td>
                        <button class="confirm-sale-button bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Confirmar</button>
                        <button class="cancel-order-button bg-red-600 text-white text-xs px-2 py-1 rounded ml-2" data-id="${id}">Cancelar</button>
                    </td>
                </tr>`;
        }).join('');
        
        ui.erp.sales.pendingOrders.innerHTML = Object.keys(orders).length > 0 ? `
            <table class="w-full text-sm">
                <thead><tr><th>Data</th><th>Cliente</th><th>WhatsApp</th><th>Itens</th><th>Total</th><th>Ações</th></tr></thead>
                <tbody>${tableBody}</tbody>
            </table>` : '<p>Nenhum pedido pendente.</p>';
    });
}

function loadSalesHistory() {
    database.ref('vendas').limitToLast(100).on('value', snapshot => {
        salesHistory = snapshot.val() || {};
        renderSalesHistory(salesHistory);
    });
}

function applySalesHistoryFilter() {
    const productFilter = ui.erp.sales.historyFilterProduct.value.toLowerCase().trim();
    const identifierFilter = ui.erp.sales.historyFilterIdentifier.value.toLowerCase().trim();

    if (!productFilter && !identifierFilter) {
        renderSalesHistory(salesHistory);
        return;
    }

    const filteredSales = {};
    for (const saleId in salesHistory) {
        const sale = salesHistory[saleId];
        let match = false;
        for (const itemId in sale.itens) {
            const item = sale.itens[itemId];
            const nameMatch = productFilter && item.nome.toLowerCase().includes(productFilter);
            const identifierMatch = identifierFilter && item.identifier.toLowerCase().includes(identifierFilter);
            if ((productFilter && identifierFilter && nameMatch && identifierMatch) || 
                (productFilter && !identifierFilter && nameMatch) ||
                (!productFilter && identifierFilter && identifierMatch)) {
                match = true;
                break;
            }
        }
        if (match) {
            filteredSales[saleId] = sale;
        }
    }
    renderSalesHistory(filteredSales);
}

function renderSalesHistory(salesData) {
    const reversedSales = Object.entries(salesData).reverse();

    if (reversedSales.length === 0) {
        ui.erp.sales.historyList.innerHTML = '<p>Nenhuma venda encontrada com os filtros atuais.</p>';
        return;
    }

    const tableBody = reversedSales.map(([id, sale]) => {
        const itemsList = Object.values(sale.itens).map(item => 
            `<div>${item.nome} (S/N: ${item.identifier}) - R$ ${item.precoVenda.toFixed(2)}</div>`
        ).join('');
        return `
            <tr>
                <td>${new Date(sale.data).toLocaleDateString()}</td>
                <td>${sale.cliente}</td>
                <td>${sale.pagamento?.metodo || 'N/A'} (${sale.pagamento?.parcelas || 1}x)</td>
                <td class="text-xs">${itemsList}</td>
                <td>R$ ${sale.total.toFixed(2).replace('.',',')}</td>
            </tr>`;
    }).join('');
    
    ui.erp.sales.historyList.innerHTML = `
        <table class="w-full text-sm">
            <thead><tr><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Itens</th><th>Total</th></tr></thead>
            <tbody>${tableBody}</tbody>
        </table>`;
}

function openPaymentConfirmationModal(orderId) {
    currentOrderToConfirm = { id: orderId, ...window.pendingOrdersData[orderId] };
    const order = currentOrderToConfirm;
    
    ui.paymentConfirmationModal.itemsContainer.innerHTML = '';
    
    let itemIndex = 0;
    for (const modelId in order.itens) {
        const item = order.itens[modelId];
        for (let i = 0; i < item.quantity; i++) {
            const product = products[item.id];
            const availableUnits = product.unidades ? Object.keys(product.unidades).filter(id => product.unidades[id].status === 'disponivel') : [];
            const options = availableUnits.map(uid => `<option value="${uid}">${uid}</option>`).join('');

            const itemHtml = `
                <div class="p-3 bg-gray-700 rounded" data-item-index="${itemIndex}">
                    <p class="font-semibold">${item.nome} (#${i+1})</p>
                    <div class="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <label class="block text-xs mb-1">Identificador (S/N)</label>
                            <select class="form-input w-full confirm-item-identifier" data-model-id="${item.id}">
                                <option value="">Selecione...</option>
                                ${options}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Preço Final (R$)</label>
                            <input type="number" step="0.01" class="form-input w-full confirm-item-price" value="${item.precoVenda.toFixed(2)}">
                        </div>
                    </div>
                </div>`;
            ui.paymentConfirmationModal.itemsContainer.innerHTML += itemHtml;
            itemIndex++;
        }
    }

    updateConfirmationTotal();
    const today = new Date().toISOString().split('T')[0];
    ui.paymentConfirmationModal.firstDueDateInput.value = today;
    ui.paymentConfirmationModal.installmentsInput.value = 1;
    ui.paymentConfirmationModal.paymentMethodSelect.value = 'Pix';
    toggleInstallmentFields();
    toggleModal(ui.paymentConfirmationModal.modal, true);
}


function updateConfirmationTotal() {
    let total = 0;
    querySelAll('.confirm-item-price').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    ui.paymentConfirmationModal.total.textContent = `R$ ${total.toFixed(2)}`;
}


function toggleInstallmentFields() {
    const method = ui.paymentConfirmationModal.paymentMethodSelect.value;
    const show = method === 'Boleto' || method === 'Cartão de Crédito';
    ui.paymentConfirmationModal.installmentFields.classList.toggle('hidden', !show);
}

async function processSaleConfirmation() {
    if (!currentOrderToConfirm) {
        alert("Erro: Pedido não encontrado.");
        return;
    }

    const orderId = currentOrderToConfirm.id;
    const order = currentOrderToConfirm;
    
    const itemElements = querySelAll('#order-items-to-confirm > div');
    const finalItems = {};
    const updates = {};
    let total = 0;

    for (const el of itemElements) {
        const identifierSelect = el.querySelector('.confirm-item-identifier');
        const priceInput = el.querySelector('.confirm-item-price');
        
        const identifier = identifierSelect.value;
        const modelId = identifierSelect.dataset.modelId;
        const price = parseFloat(priceInput.value);

        if (!identifier || isNaN(price) || price < 0) {
            alert(`Todos os itens devem ter um identificador selecionado e um preço válido.`);
            return;
        }
        if (updates[`/estoque/${modelId}/unidades/${identifier}/status`]) {
            alert(`O identificador "${identifier}" foi selecionado mais de uma vez. Por favor, escolha identificadores únicos para cada item.`);
            return;
        }

        updates[`/estoque/${modelId}/unidades/${identifier}/status`] = 'vendido';
        finalItems[identifier] = {
            modelId: modelId,
            identifier: identifier,
            nome: products[modelId].nome,
            imagem: products[modelId].imagem,
            precoVenda: price
        };
        total += price;
    }

    const paymentMethod = ui.paymentConfirmationModal.paymentMethodSelect.value;
    const installments = parseInt(ui.paymentConfirmationModal.installmentsInput.value) || 1;
    const firstDueDate = ui.paymentConfirmationModal.firstDueDateInput.value;
    
    if ((paymentMethod === 'Boleto' || paymentMethod === 'Cartão de Crédito') && !firstDueDate) {
        alert("Para esta forma de pagamento, a data do primeiro vencimento é obrigatória.");
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

        alert('Venda confirmada com sucesso! As parcelas foram geradas em Contas a Receber.');
        toggleModal(ui.paymentConfirmationModal.modal, false);
        currentOrderToConfirm = null;

    } catch (error) {
        alert('Ocorreu um erro ao processar a venda: ' + error.message);
    }
}


function cancelOrder(orderId) {
    if (confirm('Tem a certeza de que deseja cancelar este pedido?')) {
        database.ref('pedidos/' + orderId).remove().then(() => alert('Pedido cancelado!'));
    }
}

// --- MÓDULO: ESTOQUE (ERP) ---
async function saveProductModel() {
    const id = ui.erp.stock.idInput.value;
    const name = ui.erp.stock.nameInput.value;
    const price = parseFloat(ui.erp.stock.priceInput.value);
    const description = ui.erp.stock.descriptionInput.value;
    const alertLevel = parseInt(ui.erp.stock.alertLevelInput.value);
    const imageFile = ui.erp.stock.imageUploadInput.files[0];

    if (!name || isNaN(price)) {
        alert('Por favor, preencha nome e preço corretamente.');
        return;
    }

    let imageUrl = (id && products[id] && products[id].imagem) || '';
    if (imageFile) {
        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.secure_url) {
                imageUrl = data.secure_url;
            } else {
                throw new Error(data.error.message || 'Erro desconhecido no upload.');
            }
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            alert('Erro ao fazer upload da imagem. Tente novamente.');
            return;
        }
    }

    const productData = {
        nome: name,
        nome_lowercase: name.toLowerCase(),
        precoVenda: price,
        descricao: description,
        nivelAlertaEstoque: alertLevel || 0,
        imagem: imageUrl
    };

    const dbRef = id ? database.ref('estoque/' + id) : database.ref('estoque').push();
    
    // Se for um produto existente, não sobrescrever as unidades
    if(id) {
         dbRef.update(productData).then(() => {
            alert(`Modelo de produto atualizado com sucesso!`);
            toggleModal(ui.erp.stock.modal, false);
        }).catch(error => alert(`Erro ao salvar modelo: ${error.message}`));
    } else {
         dbRef.set(productData).then(() => {
            alert(`Modelo de produto adicionado com sucesso!`);
            toggleModal(ui.erp.stock.modal, false);
        }).catch(error => alert(`Erro ao salvar modelo: ${error.message}`));
    }
}

function loadStockManagement() {
    database.ref('estoque').on('value', snapshot => {
        products = snapshot.val() || {};
        renderStockTable(products);
        updateLowStockAlerts();
    });
}

function renderStockTable(data) {
    const productModels = Object.entries(data);
    let tableBody = '';

    if (productModels.length === 0) {
        tableBody = '<tr><td colspan="5" class="text-center">Nenhum modelo de produto cadastrado.</td></tr>';
    } else {
        productModels.forEach(([id, p]) => {
            const units = p.unidades || {};
            const availableUnits = Object.entries(units).filter(([uid, u]) => u.status === 'disponivel');
            const soldUnits = Object.entries(units).filter(([uid, u]) => u.status === 'vendido');
            const availableCount = availableUnits.length;
            
            tableBody += `
                <tr class="bg-gray-800 border-b border-gray-900 align-top">
                    <td><img src="${p.imagem || 'https://placehold.co/50x50/374151/9ca3af?text=Img'}" alt="${p.nome}" class="w-12 h-12 object-cover rounded"></td>
                    <td>
                        <div class="font-bold text-lg">${p.nome}</div>
                        <div class="text-xs text-gray-400 mt-2">
                            <b>Disponíveis:</b> ${availableUnits.map(([uid]) => `<span class="bg-gray-600 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">${uid}</span>`).join('') || 'Nenhuma'}
                        </div>
                         <div class="text-xs text-gray-400 mt-2">
                            <b>Vendidos:</b> ${soldUnits.map(([uid]) => `<span class="bg-red-900 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">${uid}</span>`).join('') || 'Nenhum'}
                        </div>
                    </td>
                    <td>R$ ${(p.precoVenda || 0).toFixed(2).replace('.', ',')}</td>
                    <td class="font-bold text-xl ${availableCount <= (p.nivelAlertaEstoque || 0) ? 'text-red-400' : 'text-green-400'}">${availableCount}</td>
                    <td>
                        <button class="edit-product-model-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Editar Modelo</button>
                        <button class="add-stock-unit-button bg-green-600 text-white text-xs px-2 py-1 rounded mt-1" data-id="${id}">Adicionar Unidade</button>
                        <button class="delete-product-model-button bg-red-600 text-white text-xs px-2 py-1 rounded mt-1" data-id="${id}">Excluir Modelo</button>
                    </td>
                </tr>`;
        });
    }

    ui.erp.stock.list.innerHTML = `
        <table class="w-full text-sm">
            <thead><tr><th>Imagem</th><th>Modelo e Unidades</th><th>Preço Padrão</th><th>Qtd. Disp.</th><th>Ações</th></tr></thead>
            <tbody>${tableBody}</tbody>
        </table>
    `;
}

function applyStockFilter() {
    const productFilter = ui.erp.stock.filterProduct.value.toLowerCase().trim();
    const identifierFilter = ui.erp.stock.filterIdentifier.value.toLowerCase().trim();

    if (!productFilter && !identifierFilter) {
        renderStockTable(products);
        return;
    }

    const filteredProducts = {};
    for (const modelId in products) {
        const product = products[modelId];
        const productNameMatch = product.nome.toLowerCase().includes(productFilter);
        
        const matchingUnits = {};
        let hasMatchingUnit = false;
        if (product.unidades) {
            for (const unitId in product.unidades) {
                if (unitId.toLowerCase().includes(identifierFilter)) {
                    matchingUnits[unitId] = product.unidades[unitId];
                    hasMatchingUnit = true;
                }
            }
        }

        if (productNameMatch && (!identifierFilter || hasMatchingUnit)) {
            filteredProducts[modelId] = { ...product };
            if (identifierFilter) {
                filteredProducts[modelId].unidades = matchingUnits;
            }
        }
    }
    renderStockTable(filteredProducts);
}


function openEditProductModelModal(modelId) {
    const p = products[modelId];
    if (p) {
        ui.erp.stock.title.textContent = 'Editar Modelo de Produto';
        ui.erp.stock.idInput.value = modelId;
        ui.erp.stock.nameInput.value = p.nome;
        ui.erp.stock.priceInput.value = p.precoVenda;
        ui.erp.stock.descriptionInput.value = p.descricao;
        ui.erp.stock.alertLevelInput.value = p.nivelAlertaEstoque;
        ui.erp.stock.imageUploadInput.value = '';
        toggleModal(ui.erp.stock.modal, true);
    }
}

function openNewProductModelModal() {
    ui.erp.stock.title.textContent = 'Adicionar Modelo de Produto';
    ui.erp.stock.idInput.value = '';
    ui.erp.stock.nameInput.value = '';
    ui.erp.stock.priceInput.value = '';
    ui.erp.stock.descriptionInput.value = '';
    ui.erp.stock.alertLevelInput.value = '';
    ui.erp.stock.imageUploadInput.value = '';
    toggleModal(ui.erp.stock.modal, true);
}

function addStockUnit(modelId) {
    const identifier = prompt(`Digite o identificador (Nº de Série) para "${products[modelId].nome}":`);
    if (identifier) {
        const cleanIdentifier = identifier.trim();
        const unitRef = database.ref(`estoque/${modelId}/unidades/${cleanIdentifier}`);
        unitRef.once('value', snapshot => {
            if(snapshot.exists()) {
                alert('Erro: Este identificador já existe para este produto.');
            } else {
                unitRef.set({ status: 'disponivel' })
                    .then(() => alert('Unidade adicionada ao estoque!'))
                    .catch(e => alert('Erro: ' + e.message));
            }
        });
    }
}

function deleteProductModel(modelId) {
    if (confirm('Tem a certeza de que deseja excluir este modelo de produto e TODAS as suas unidades em estoque? Esta ação é irreversível.')) {
        database.ref('estoque/' + modelId).remove()
            .then(() => alert('Modelo de produto excluído com sucesso!'))
            .catch(error => alert('Erro ao excluir modelo: ' + error.message));
    }
}

// --- MÓDULO: COMPRAS E FORNECEDORES ---
function saveSupplier() {
    const id = ui.erp.suppliers.idInput.value;
    const name = ui.erp.suppliers.nameInput.value.trim();
    const contact = ui.erp.suppliers.contactInput.value.trim();
    if (!name) {
        alert("O nome do fornecedor é obrigatório.");
        return;
    }
    const supplierData = { nome: name, contato: contact };
    const ref = id ? database.ref('fornecedores/' + id) : database.ref('fornecedores').push();
    ref.set(supplierData).then(() => {
        alert(`Fornecedor ${id ? 'atualizado' : 'salvo'} com sucesso!`);
        toggleModal(ui.erp.suppliers.modal, false);
    }).catch(e => alert("Erro: " + e.message));
}

function loadSupplierManagement() {
    database.ref('fornecedores').on('value', snapshot => {
        suppliers = snapshot.val() || {};
        const tableBody = Object.entries(suppliers).map(([id, s]) => `
            <tr>
                <td>${s.nome}</td>
                <td>${s.contato}</td>
                <td>
                    <button class="edit-supplier-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Editar</button>
                    <button class="delete-supplier-button bg-red-600 text-white text-xs px-2 py-1 rounded ml-2" data-id="${id}">Excluir</button>
                </td>
            </tr>
        `).join('');
        ui.erp.suppliers.list.innerHTML = `
            <table class="w-full text-sm">
                <thead><tr><th>Nome</th><th>Contato</th><th>Ações</th></tr></thead>
                <tbody>${tableBody || '<tr><td colspan="3" class="text-center">Nenhum fornecedor registado.</td></tr>'}</tbody>
            </table>`;
    });
}

function openEditSupplierModal(id) {
    const s = suppliers[id];
    if (s) {
        ui.erp.suppliers.title.textContent = "Editar Fornecedor";
        ui.erp.suppliers.idInput.value = id;
        ui.erp.suppliers.nameInput.value = s.nome;
        ui.erp.suppliers.contactInput.value = s.contato;
        toggleModal(ui.erp.suppliers.modal, true);
    }
}

function openNewSupplierModal() {
    ui.erp.suppliers.title.textContent = "Adicionar Fornecedor";
    ui.erp.suppliers.idInput.value = '';
    ui.erp.suppliers.nameInput.value = '';
    ui.erp.suppliers.contactInput.value = '';
    toggleModal(ui.erp.suppliers.modal, true);
}

function deleteSupplier(id) {
    if (confirm("Tem a certeza de que deseja excluir este fornecedor?")) {
        database.ref('fornecedores/' + id).remove()
        .then(() => alert("Fornecedor excluído."))
        .catch(e => alert("Erro: " + e.message));
    }
}

function openNewPurchaseModal() {
    const supplierOptions = Object.entries(suppliers).map(([id, s]) => `<option value="${id}">${s.nome}</option>`).join('');
    const productOptions = Object.entries(products).map(([id, p]) => `<option value="${id}">${p.nome}</option>`).join('');
    if(!supplierOptions || !productOptions) {
        alert("É necessário ter pelo menos um fornecedor e um modelo de produto registado.");
        return;
    }
    ui.erp.purchases.supplierSelect.innerHTML = supplierOptions;
    ui.erp.purchases.productSelect.innerHTML = productOptions;
    
    ui.erp.purchases.invoiceInput.value = '';
    ui.erp.purchases.paymentMethodSelect.value = 'Boleto';
    ui.erp.purchases.dateInput.value = new Date().toISOString().split('T')[0];
    ui.erp.purchases.priceInput.value = '';
    ui.erp.purchases.identifiersTextarea.value = '';
    
    currentPurchaseItems = [];
    updatePurchaseItemsList();
    toggleModal(ui.erp.purchases.modal, true);
}

function addItemToPurchase() {
    const productId = ui.erp.purchases.productSelect.value;
    const unitPrice = parseFloat(ui.erp.purchases.priceInput.value);
    const identifiers = ui.erp.purchases.identifiersTextarea.value.trim().split('\n').filter(Boolean);

    if (!productId || isNaN(unitPrice) || unitPrice < 0 || identifiers.length === 0) {
        alert("Dados do item inválidos. Selecione produto, custo e insira ao menos um identificador.");
        return;
    }
    
    currentPurchaseItems.push({
        modelId: productId,
        nome: products[productId].nome,
        unitPrice: unitPrice,
        identifiers: identifiers
    });

    updatePurchaseItemsList();
    // Limpar campos para o próximo item
    ui.erp.purchases.priceInput.value = '';
    ui.erp.purchases.identifiersTextarea.value = '';
}

function updatePurchaseItemsList() {
    let total = 0;
    ui.erp.purchases.itemsList.innerHTML = currentPurchaseItems.map((item, index) => {
        const subtotal = item.identifiers.length * item.unitPrice;
        total += subtotal;
        return `<div class="flex justify-between items-center p-2 bg-gray-700 rounded mb-1">
                    <div>
                        <p>${item.identifiers.length}x ${item.nome} @ R$ ${item.unitPrice.toFixed(2)}</p>
                        <p class="text-xs text-gray-400">S/N: ${item.identifiers.join(', ')}</p>
                    </div>
                    <button class="text-red-400 hover:text-red-600 remove-purchase-item-button" data-index="${index}">&times;</button>
                </div>`;
    }).join('');
    ui.erp.purchases.total.textContent = `R$ ${total.toFixed(2)}`;
}

function removeItemFromPurchase(itemIndex) {
    currentPurchaseItems.splice(itemIndex, 1);
    updatePurchaseItemsList();
}

function savePurchase() {
    const supplierId = ui.erp.purchases.supplierSelect.value;
    const invoiceNumber = ui.erp.purchases.invoiceInput.value.trim();
    const purchaseDate = ui.erp.purchases.dateInput.value;
    const paymentMethod = ui.erp.purchases.paymentMethodSelect.value;

    if (!supplierId || !invoiceNumber || !purchaseDate || currentPurchaseItems.length === 0) {
        alert("Preencha todos os campos da compra e adicione itens.");
        return;
    }

    const total = currentPurchaseItems.reduce((sum, item) => sum + (item.identifiers.length * item.unitPrice), 0);
    const purchaseData = {
        fornecedorId: supplierId,
        fornecedorNome: suppliers[supplierId].nome,
        itens: currentPurchaseItems,
        total: total,
        status: 'Aguardando Recebimento',
        dataRegistro: new Date().toISOString(),
        numeroNota: invoiceNumber,
        dataCompra: purchaseDate,
        formaPagamento: paymentMethod
    };
    
    database.ref('compras').push(purchaseData).then(() => {
        alert("Compra registada com sucesso!");
        toggleModal(ui.erp.purchases.modal, false);
    }).catch(e => alert("Erro: " + e.message));
}

function loadPurchases() {
    database.ref('compras').on('value', snapshot => {
        const purchases = snapshot.val() || {};
        const tableBody = Object.entries(purchases).map(([id, p]) => `
            <tr class="align-middle">
                <td>${new Date(p.dataCompra).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td>${p.numeroNota}</td>
                <td>${p.fornecedorNome}</td>
                <td>R$ ${p.total.toFixed(2).replace('.',',')}</td>
                <td>${p.formaPagamento}</td>
                <td><span class="px-2 py-1 text-xs rounded-full ${p.status === 'Recebido' ? 'bg-green-700' : 'bg-yellow-700'}">${p.status}</span></td>
                <td>
                    ${p.status === 'Aguardando Recebimento' ? `<button class="confirm-receipt-button bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${id}">Receber</button>` : ''}
                    <button class="delete-purchase-button bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded ml-2" data-id="${id}">Excluir</button>
                </td>
            </tr>`).join('');
        ui.erp.purchases.list.innerHTML = `
            <table class="w-full text-sm">
                <thead><tr><th>Data</th><th>Nº Nota</th><th>Fornecedor</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>${tableBody || '<tr><td colspan="7" class="text-center">Nenhuma compra registada.</td></tr>'}</tbody>
            </table>`;
    });
}

function deletePurchase(purchaseId) {
    const purchaseRef = database.ref('compras/' + purchaseId);
    purchaseRef.once('value', snapshot => {
        const purchase = snapshot.val();
        if (!purchase) return;

        if (purchase.status === 'Recebido') {
            alert('Não é possível excluir uma compra que já foi recebida e teve o estoque atualizado.');
            return;
        }

        if (confirm(`Tem a certeza de que deseja excluir a compra da NF #${purchase.numeroNota}? Esta ação não pode ser desfeita.`)) {
            purchaseRef.remove()
                .then(() => alert('Nota de compra excluída com sucesso!'))
                .catch(error => alert('Erro ao excluir nota: ' + error.message));
        }
    });
}

async function confirmPurchaseReceipt(purchaseId) {
    const purchaseRef = database.ref('compras/' + purchaseId);
    const purchaseSnapshot = await purchaseRef.once('value');
    const purchase = purchaseSnapshot.val();
    if (purchase && confirm('Confirmar o recebimento desta compra? O estoque será atualizado e uma conta a pagar será gerada.')) {
        const updates = {};
        for (const item of purchase.itens) {
            for (const identifier of item.identifiers) {
                updates[`/estoque/${item.modelId}/unidades/${identifier}`] = { status: 'disponivel' };
            }
        }
        await database.ref().update(updates);

        await database.ref('contasPagar').push({
            compraId: purchaseId,
            fornecedorId: purchase.fornecedorId,
            fornecedorNome: purchase.fornecedorNome,
            descricao: `Pagamento NF #${purchase.numeroNota}`,
            valor: purchase.total,
            dataVencimento: purchase.dataCompra,
            status: 'Pendente'
        });
        
        await purchaseRef.update({ status: 'Recebido' });
        alert('Recebimento confirmado, estoque atualizado e conta a pagar gerada!');
    }
}

// --- MÓDULO FINANCEIRO ---
function openNewExpenseModal() {
    ui.expenseModal.descriptionInput.value = '';
    ui.expenseModal.valueInput.value = '';
    ui.expenseModal.dueDateInput.value = new Date().toISOString().split('T')[0];
    ui.expenseModal.categorySelect.value = 'Custo Fixo';
    toggleModal(ui.expenseModal.modal, true);
}

function saveExpense() {
    const description = ui.expenseModal.descriptionInput.value.trim();
    const value = parseFloat(ui.expenseModal.valueInput.value);
    const dueDate = ui.expenseModal.dueDateInput.value;
    const category = ui.expenseModal.categorySelect.value;

    if (!description || isNaN(value) || value <= 0 || !dueDate) {
        alert("Preencha todos os campos da despesa corretamente.");
        return;
    }

    const expenseData = {
        descricao: description,
        categoria: category,
        valor: value,
        dataVencimento: dueDate,
        status: 'Pendente'
    };

    database.ref('contasPagar').push(expenseData).then(() => {
        alert("Despesa lançada com sucesso!");
        toggleModal(ui.expenseModal.modal, false);
    }).catch(error => {
        alert("Erro ao salvar despesa: " + error.message);
    });
}

function loadFinance() {
    database.ref('contasReceber').orderByChild('dataVencimento').on('value', (snapshot) => {
        const accounts = snapshot.val() || {};
        const tableBody = Object.entries(accounts).map(([id, acc]) => {
            const isPaid = acc.status === 'Recebido';
            return `
            <tr>
                <td>${new Date(acc.dataVencimento + 'T12:00:00Z').toLocaleDateString()}</td>
                <td>${acc.clienteNome || 'N/A'}</td>
                <td>${acc.descricao}</td>
                <td class="text-green-400">+ R$ ${acc.valor.toFixed(2).replace('.',',')}</td>
                <td><span class="px-2 py-1 text-xs rounded-full ${isPaid ? 'bg-green-700' : 'bg-yellow-700'}">${acc.status}</span></td>
                <td>${!isPaid ? `<button class="confirm-transaction-button bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${id}" data-type="receber">Receber</button>` : `Liquidado em ${new Date(acc.dataRecebimento).toLocaleDateString()}`}</td>
            </tr>`;
        }).join('');
        ui.erp.finance.accountsReceivable.innerHTML = `
            <table class="w-full text-sm"><thead><tr><th>Vencimento</th><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>${tableBody || '<tr><td colspan="6" class="text-center">Nenhuma conta a receber.</td></tr>'}</tbody></table>`;
    });

    database.ref('contasPagar').orderByChild('dataVencimento').on('value', (snapshot) => {
        const accounts = snapshot.val() || {};
        const tableBody = Object.entries(accounts).map(([id, acc]) => {
            const isPaid = acc.status === 'Paga';
            return `
            <tr>
                <td>${new Date(acc.dataVencimento + 'T12:00:00Z').toLocaleDateString()}</td>
                <td>${acc.fornecedorNome || acc.categoria}</td>
                <td>${acc.descricao}</td>
                <td class="text-red-400">- R$ ${acc.valor.toFixed(2).replace('.',',')}</td>
                <td><span class="px-2 py-1 text-xs rounded-full ${isPaid ? 'bg-green-700' : 'bg-yellow-700'}">${acc.status}</span></td>
                <td>${!isPaid ? `<button class="confirm-transaction-button bg-blue-600 text-white text-xs px-2 py-1 rounded" data-id="${id}" data-type="pagar">Pagar</button>` : `Liquidado em ${new Date(acc.dataPagamento).toLocaleDateString()}`}</td>
            </tr>`;
        }).join('');
        ui.erp.finance.accountsPayable.innerHTML = `
            <table class="w-full text-sm"><thead><tr><th>Vencimento</th><th>Fornecedor/Categoria</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>${tableBody || '<tr><td colspan="6" class="text-center">Nenhuma conta a pagar.</td></tr>'}</tbody></table>`;
    });

    database.ref('fluxoDeCaixa').on('value', (snapshot) => {
        const transactions = snapshot.val() || {};
        const balance = Object.values(transactions).reduce((acc, t) => acc + t.valor, 0);
        ui.erp.finance.cashBalance.textContent = `R$ ${balance.toFixed(2).replace('.',',')}`;
        ui.erp.finance.cashBalance.classList.toggle('text-red-400', balance < 0);
        ui.erp.finance.cashBalance.classList.toggle('text-green-400', balance >= 0);
    });
}

async function confirmTransaction(accountId, type) {
    const isReceiving = type === 'receber';
    const node = isReceiving ? 'contasReceber' : 'contasPagar';
    const newStatus = isReceiving ? 'Recebido' : 'Paga';
    const dateField = isReceiving ? 'dataRecebimento' : 'dataPagamento';
    const confirmationText = isReceiving ? 'Recebimento' : 'Pagamento';
    
    const accountRef = database.ref(`${node}/${accountId}`);
    const snapshot = await accountRef.once('value');
    const account = snapshot.val();

    if (!account || account.status !== 'Pendente') return;
    
    if (confirm(`Confirmar ${confirmationText} de R$ ${account.valor.toFixed(2)}?`)) {
        try {
            await accountRef.update({
                status: newStatus,
                [dateField]: new Date().toISOString()
            });

            await database.ref('fluxoDeCaixa').push({
                descricao: `${confirmationText}: ${account.descricao}`,
                valor: isReceiving ? account.valor : -account.valor,
                data: new Date().toISOString()
            });

            alert(`${confirmationText} confirmado e lançado no caixa!`);
        } catch (error) {
            alert(`Erro ao confirmar ${confirmationText}: ` + error.message);
        }
    }
}

// --- OUTRAS FUNÇÕES ---
function updateLowStockAlerts() {
    if (!ui.erp.dashboard.lowStockAlerts) return;
    const lowStockProducts = Object.values(products).filter(p => {
        const availableCount = p.unidades ? Object.values(p.unidades).filter(u => u.status === 'disponivel').length : 0;
        return availableCount <= (p.nivelAlertaEstoque || 0);
    });
    if (lowStockProducts.length === 0) {
        ui.erp.dashboard.lowStockAlerts.innerHTML = '<li>Nenhum alerta de estoque baixo.</li>';
    } else {
        ui.erp.dashboard.lowStockAlerts.innerHTML = lowStockProducts.map(p => {
            const availableCount = p.unidades ? Object.values(p.unidades).filter(u => u.status === 'disponivel').length : 0;
            return `<li class="text-red-400">${p.nome}: ${availableCount} em estoque (Alerta: ${p.nivelAlertaEstoque})</li>`;
        }).join('');
    }
}

function calculateDailySalesAndMonthlyRevenue() {
    database.ref('vendas').on('value', (snapshot) => {
        const sales = snapshot.val() || {};
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        let daily = 0, monthly = 0;
        Object.values(sales).forEach(sale => {
            const saleDate = new Date(sale.data).getTime();
            if (saleDate >= startOfMonth) monthly += sale.total;
            if (saleDate >= startOfDay) daily += sale.total;
        });
        ui.erp.dashboard.dailySales.textContent = `R$ ${daily.toFixed(2).replace('.',',')}`;
        ui.erp.dashboard.monthlyRevenue.textContent = `R$ ${monthly.toFixed(2).replace('.',',')}`;
    });
}

function initiateSystemReset() {
    const password = prompt("Esta é uma ação IRREVERSÍVEL e apagará TODOS os dados (produtos, vendas, clientes, etc). \n\nDigite a senha '9999' para continuar.");
    if (password === '9999') {
        if (confirm("TEM CERTEZA ABSOLUTA? Todos os dados serão permanentemente excluídos. Esta ação não pode ser desfeita.")) {
            performSystemReset();
        }
    } else if (password !== null) {
        alert("Senha incorreta.");
    }
}

async function performSystemReset() {
    const resetData = {
        '/estoque': null,
        '/vendas': null,
        '/pedidos': null,
        '/clientes': null,
        '/fornecedores': null,
        '/compras': null,
        '/fluxoDeCaixa': null,
        '/contasReceber': null,
        '/contasPagar': null,
    };

    try {
        await database.ref().update(resetData);
        alert("Sistema reiniciado com sucesso. A página será recarregada.");
        location.reload();
    } catch (error) {
        alert("Ocorreu um erro ao tentar reiniciar o sistema: " + error.message);
    }
}


// --- INICIALIZAÇÃO E EVENT LISTENERS ---
function attachEventListeners() {
    // Navegação e Autenticação
    ui.authButton.addEventListener('click', handleAuthClick);
    ui.nav.home.addEventListener('click', (e) => { e.preventDefault(); switchView('public'); });
    ui.nav.shop.addEventListener('click', (e) => { e.preventDefault(); switchView('public'); });
    ui.nav.dashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('management'); });
    ui.erp.tabs.forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    ui.erp.dashboard.resetSystemButton.addEventListener('click', initiateSystemReset);

    // Delegação de Eventos para botões e inputs dinâmicos
    document.body.addEventListener('click', e => {
        const target = e.target.closest('button');
        if (!target) return;

        const datasetId = target.dataset.id;
        
        if (target.classList.contains('add-to-cart-button')) addToCart(datasetId);
        else if (target.classList.contains('remove-from-cart-button')) removeFromCart(datasetId);
        else if (target.classList.contains('edit-product-model-button')) openEditProductModelModal(datasetId);
        else if (target.classList.contains('delete-product-model-button')) deleteProductModel(datasetId);
        else if (target.classList.contains('add-stock-unit-button')) addStockUnit(datasetId);
        else if (target.classList.contains('edit-supplier-button')) openEditSupplierModal(datasetId);
        else if (target.classList.contains('delete-supplier-button')) deleteSupplier(datasetId);
        else if (target.classList.contains('edit-customer-button')) openEditCustomerModal(datasetId);
        else if (target.classList.contains('delete-customer-button')) deleteCustomer(datasetId);
        else if (target.classList.contains('confirm-receipt-button')) confirmPurchaseReceipt(datasetId);
        else if (target.classList.contains('delete-purchase-button')) deletePurchase(datasetId);
        else if (target.classList.contains('confirm-sale-button')) openPaymentConfirmationModal(datasetId);
        else if (target.classList.contains('cancel-order-button')) cancelOrder(datasetId);
        else if (target.classList.contains('confirm-transaction-button')) confirmTransaction(datasetId, target.dataset.type);
        else if (target.classList.contains('remove-purchase-item-button')) removeItemFromPurchase(target.dataset.index);
        else if (target.classList.contains('remove-sale-item-button')) removeItemFromSale(target.dataset.index);
    });

    // Listener de input para modal de confirmação de venda
    ui.paymentConfirmationModal.modal.addEventListener('input', e => {
        if (e.target.classList.contains('confirm-item-price')) {
            updateConfirmationTotal();
        }
    });

    // Modais
    ui.nav.cart.addEventListener('click', (e) => { e.preventDefault(); toggleModal(ui.cart.modal, true); });
    ui.cart.closeButton.addEventListener('click', () => toggleModal(ui.cart.modal, false));
    ui.cart.checkoutButton.addEventListener('click', () => {
        toggleModal(ui.cart.modal, false);
        toggleModal(ui.checkout.modal, true);
    });
    ui.checkout.closeButton.addEventListener('click', () => toggleModal(ui.checkout.modal, false));
    ui.checkout.submitButton.addEventListener('click', submitCheckout);
    ui.paymentConfirmationModal.closeButton.addEventListener('click', () => toggleModal(ui.paymentConfirmationModal.modal, false));
    ui.paymentConfirmationModal.processButton.addEventListener('click', processSaleConfirmation);
    ui.paymentConfirmationModal.paymentMethodSelect.addEventListener('change', toggleInstallmentFields);

    // Modais do ERP
    ui.erp.stock.addModelButton.addEventListener('click', openNewProductModelModal);
    ui.erp.stock.closeModalButton.addEventListener('click', () => toggleModal(ui.erp.stock.modal, false));
    ui.erp.stock.saveButton.addEventListener('click', saveProductModel);

    ui.erp.suppliers.addButton.addEventListener('click', openNewSupplierModal);
    ui.erp.suppliers.closeModalButton.addEventListener('click', () => toggleModal(ui.erp.suppliers.modal, false));
    ui.erp.suppliers.saveButton.addEventListener('click', saveSupplier);

    ui.erp.customers.addButton.addEventListener('click', openNewCustomerModal);
    ui.erp.customers.closeModalButton.addEventListener('click', () => toggleModal(ui.erp.customers.modal, false));
    ui.erp.customers.saveButton.addEventListener('click', saveCustomer);
    
    ui.erp.purchases.newButton.addEventListener('click', openNewPurchaseModal);
    ui.erp.purchases.closeModalButton.addEventListener('click', () => toggleModal(ui.erp.purchases.modal, false));
    ui.erp.purchases.addItemButton.addEventListener('click', addItemToPurchase);
    ui.erp.purchases.saveButton.addEventListener('click', savePurchase);
    
    ui.erp.sales.newSaleButton.addEventListener('click', openNewSaleModal);
    ui.erp.sales.closeManualSaleModal.addEventListener('click', () => toggleModal(ui.erp.sales.manualSaleModal, false));
    ui.erp.sales.addItemButton.addEventListener('click', addItemToSale);
    ui.erp.sales.saveManualSaleButton.addEventListener('click', saveManualSale);
    ui.erp.sales.productModelSelect.addEventListener('change', populateSaleIdentifiers);
    
    ui.erp.finance.newExpenseButton.addEventListener('click', openNewExpenseModal);
    ui.expenseModal.closeButton.addEventListener('click', () => toggleModal(ui.expenseModal.modal, false));
    ui.expenseModal.saveButton.addEventListener('click', saveExpense);

    // Listeners dos filtros
    ui.erp.stock.filterProduct.addEventListener('input', applyStockFilter);
    ui.erp.stock.filterIdentifier.addEventListener('input', applyStockFilter);
    ui.erp.sales.applyHistoryFilterButton.addEventListener('click', applySalesHistoryFilter);
}

document.addEventListener('DOMContentLoaded', () => {
    querySelAll('.modal-backdrop').forEach(modal => modal.classList.add('hidden'));
    loadPublicProducts();
    attachEventListeners();
    updateCartDisplay();
});
