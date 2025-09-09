/**
 * Techmess ERP - Sistema Profissional de Gestão
 * Versão 4.1 - CORRIGIDA
 * * Correções implementadas:
 * - Restaurada a lógica de negócio para criação de Contas a Pagar APENAS no recebimento da compra.
 * - Corrigida a interface do modal de Venda Manual para exibir campos de parcelamento.
 * - Centralizado e limpo o código de event listeners.
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
    stockItems: {},
    isAuthenticated: false
};

// UTILITÁRIOS
const Utils = {
    formatCurrency: (value) => `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`,
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
    // ... (nenhuma alteração nesta seção)
    publicView: document.getElementById('public-view'),
    managementPanel: document.getElementById('management-panel'),
    authButton: document.getElementById('auth-button'),
    navHome: document.getElementById('nav-home'),
    navShop: document.getElementById('nav-shop'),
    navCart: document.getElementById('nav-cart'),
    navDashboard: document.getElementById('nav-dashboard'),
    cartItemCount: document.getElementById('cart-item-count'),
    productList: document.getElementById('product-list'),
    cartModal: document.getElementById('cart-modal'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    checkoutButton: document.getElementById('checkout-button'),
    closeCartModal: document.getElementById('close-cart-modal'),
    checkoutModal: document.getElementById('checkout-modal'),
    customerName: document.getElementById('customer-name'),
    customerWhatsapp: document.getElementById('customer-whatsapp'),
    submitCheckout: document.getElementById('submit-checkout'),
    closeCheckoutModal: document.getElementById('close-checkout-modal'),
    monthlyRevenue: document.getElementById('monthly-revenue'),
    dailySales: document.getElementById('daily-sales'),
    totalStock: document.getElementById('total-stock'),
    pendingReceivables: document.getElementById('pending-receivables'),
    lowStockAlerts: document.getElementById('low-stock-alerts'),
    resetSystemButton: document.getElementById('reset-system-button'),
    pendingOrders: document.getElementById('pending-orders'),
    salesHistoryList: document.getElementById('sales-history-list'),
    newSaleButton: document.getElementById('new-sale-button'),
    salesHistoryFilterProduct: document.getElementById('sales-history-filter-product'),
    salesHistoryFilterIdentifier: document.getElementById('sales-history-filter-identifier'),
    applySalesHistoryFilter: document.getElementById('apply-sales-history-filter'),
    productManagementList: document.getElementById('product-management-list'),
    addProductModelButton: document.getElementById('add-product-model-button'),
    stockFilterProduct: document.getElementById('stock-filter-product'),
    stockFilterIdentifier: document.getElementById('stock-filter-identifier'),
    purchaseList: document.getElementById('purchase-list'),
    newPurchaseButton: document.getElementById('new-purchase-button'),
    customerList: document.getElementById('customer-list'),
    addCustomerButton: document.getElementById('add-customer-button'),
    supplierList: document.getElementById('supplier-list'),
    addSupplierButton: document.getElementById('add-supplier-button'),
    cashBalance: document.getElementById('cash-balance'),
    accountsReceivable: document.getElementById('accounts-receivable'),
    accountsPayable: document.getElementById('accounts-payable'),
    newExpenseButton: document.getElementById('new-expense-button'),
    reportsFilterProduct: document.getElementById('reports-filter-product'),
    reportsFilterIdentifier: document.getElementById('reports-filter-identifier'),
    reportsFilterDateStart: document.getElementById('reports-filter-date-start'),
    reportsFilterDateEnd: document.getElementById('reports-filter-date-end'),
    generateSalesReport: document.getElementById('generate-sales-report'),
    generateStockReport: document.getElementById('generate-stock-report'),
    generateFinancialReport: document.getElementById('generate-financial-report'),
    reportsOutput: document.getElementById('reports-output'),
    paymentConfirmationModal: document.getElementById('payment-confirmation-modal'),
    manualSaleModal: document.getElementById('manual-sale-modal'),
    customerFormModal: document.getElementById('customer-form-modal'),
    productModelFormModal: document.getElementById('product-model-form-modal'),
    supplierFormModal: document.getElementById('supplier-form-modal'),
    purchaseFormModal: document.getElementById('purchase-form-modal'),
    expenseFormModal: document.getElementById('expense-form-modal'),
    detailsModal: document.getElementById('details-modal'),
    closePaymentConfirmationModal: document.getElementById('close-payment-confirmation-modal'),
    closeManualSaleModal: document.getElementById('close-manual-sale-modal'),
    closeCustomerFormModal: document.getElementById('close-customer-form-modal'),
    closeProductModelFormModal: document.getElementById('close-product-model-form-modal'),
    closeSupplierFormModal: document.getElementById('close-supplier-form-modal'),
    closePurchaseFormModal: document.getElementById('close-purchase-form-modal'),
    closeExpenseFormModal: document.getElementById('close-expense-form-modal'),
    closeDetailsModal: document.getElementById('close-details-modal')
};

// ... (UI, Auth, Shop, Cart, Stock permanecem inalterados) ...

// GESTÃO DE VENDAS
const Sales = {
    // ... (outras funções do objeto Sales) ...

    openNewSaleModal() {
        // Carregar clientes
        const customerSelect = document.getElementById('sale-customer');
        const customerOptions = Object.entries(AppState.customers)
            .map(([id, customer]) => `<option value="${id}">${customer.nome}</option>`)
            .join('');
        customerSelect.innerHTML = '<option value="">Selecione o Cliente</option>' + customerOptions;

        // Carregar produtos
        const productSelect = document.getElementById('sale-product-model');
        const productOptions = Object.entries(AppState.products)
            .map(([id, product]) => `<option value="${id}">${product.nome}</option>`)
            .join('');
        productSelect.innerHTML = '<option value="">Selecione o Modelo</option>' + productOptions;

        // Configurar data atual e campos de pagamento
        document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('sale-payment-method').value = 'Pix';
        document.getElementById('sale-installments').value = 1;
        document.getElementById('sale-first-due-date').value = new Date().toISOString().split('T')[0];

        // *** CORREÇÃO APLICADA AQUI ***
        this.toggleManualSaleInstallmentFields(); // Garante que o estado inicial da UI esteja correto
        
        // Limpar itens
        AppState.currentSaleItems = [];
        this.updateSaleItemsList();
        
        UI.toggleModal(DOM.manualSaleModal, true);
    },
    
    // *** NOVA FUNÇÃO PARA CONTROLAR A UI DO MODAL DE VENDA MANUAL ***
    toggleManualSaleInstallmentFields() {
        const method = document.getElementById('sale-payment-method').value;
        const installmentFields = document.getElementById('sale-installment-fields');
        const show = ['Boleto', 'Cartão de Crédito', 'Carteira Digital'].includes(method);
        installmentFields.classList.toggle('hidden', !show);
    },

    // ... (outras funções do objeto Sales, como saveManualSale, permanecem inalteradas) ...
};

// GESTÃO DE COMPRAS
const Purchases = {
    // ... (funções loadPurchases, renderPurchases, etc.) ...
    
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
                // *** DADOS DE PAGAMENTO SÃO SALVOS NA COMPRA PARA USO POSTERIOR ***
                pagamento: {
                    metodo: paymentMethod,
                    parcelas: installments,
                    primeiroVencimento: firstDueDate
                }
            };
            
            // *** CORREÇÃO: LÓGICA DE CRIAR CONTAS A PAGAR FOI REMOVIDA DAQUI ***
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

            // 1. Atualizar estoque
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

            // *** CORREÇÃO: LÓGICA DE CRIAR CONTAS A PAGAR RESTAURADA PARA ESTE PONTO ***
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
            
            // 3. Atualizar status da compra
            await purchaseRef.update({ status: 'Recebido', dataRecebimento: new Date().toISOString() });
            
            Utils.showNotification('Recebimento confirmado! Estoque atualizado e contas a pagar geradas!', 'success');
            
        } catch (error) {
            console.error("Erro ao confirmar recebimento:", error);
            Utils.showNotification('Erro ao confirmar recebimento: ' + error.message, 'error');
        }
    },

    // ... (demais funções do objeto Purchases) ...
};

// ... (Customers, Suppliers, Finance, Dashboard, Reports, SystemReset permanecem inalterados) ...

// EVENT LISTENERS
const EventListeners = {
    init() {
        // ... (outros listeners)

        // Vendas - Modal de confirmação
        document.getElementById('confirm-sale-payment-method').addEventListener('change', Sales.toggleInstallmentFields);
        document.getElementById('process-sale-confirmation-button').addEventListener('click', Sales.processSaleConfirmation);

        // Vendas - Modal manual
        document.getElementById('sale-product-model').addEventListener('change', Sales.populateSaleIdentifiers);
        document.getElementById('add-item-to-sale-button').addEventListener('click', Sales.addItemToSale);
        
        // *** CORREÇÃO: ADICIONADO O LISTENER FALTANTE AO CENTRALIZADOR ***
        document.getElementById('sale-payment-method').addEventListener('change', Sales.toggleManualSaleInstallmentFields);

        // Compras - Modal
        document.getElementById('purchase-payment-method').addEventListener('change', Purchases.togglePaymentDetails);
        document.getElementById('add-item-to-purchase-button').addEventListener('click', Purchases.addItemToPurchase);

        // ... (resto dos listeners)
    }
};

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    EventListeners.init();
    Shop.loadPublicProducts();
    
    // Inicializar filtros em tempo real
    DOM.stockFilterProduct.addEventListener('input', Stock.applyFilters);
    DOM.stockFilterIdentifier.addEventListener('input', Stock.applyFilters);
    
    console.log('Techmess ERP v4.1 - Sistema Profissional de Gestão inicializado com sucesso!');
});

// Exportar para uso global (se necessário)
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

// *** CORREÇÃO: O BLOCO DUPLICADO DE DOMContentLoaded FOI REMOVIDO DAQUI ***
