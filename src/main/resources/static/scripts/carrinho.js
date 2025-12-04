// ========== CARRINHO PAGE - Scripts específicos ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Carrinho page - Script carregado');

    // ========== VERIFICAÇÃO DE LOGIN ==========
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showCartEmptyState('Você precisa estar logado para acessar o carrinho!');

        const loginBtn = document.createElement('a');
        loginBtn.href = '/login?redirect=' + encodeURIComponent('/carrinho');
        loginBtn.className = 'btn btn-primary mt-20';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Fazer Login';

        const emptyDiv = document.querySelector('.cart-empty');
        if (emptyDiv) emptyDiv.appendChild(loginBtn);
        return;
    }

    // ========== CARREGAR ITENS DO CARRINHO ==========
    async function loadCartItems() {
        try {
            console.log('Carregando itens do carrinho...');

            const response = await fetch('/api/carrinho', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                console.log('Sessão expirada');
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('usuario');
                window.location.href = '/login?redirect=' + encodeURIComponent('/carrinho');
                return;
            }

            if (!response.ok) {
                console.log('Erro na API');
                showCartEmptyState('Erro ao carregar carrinho. Tente novamente mais tarde.');
                return;
            }

            const data = await response.json();
            console.log('Dados do carrinho recebidos:', data);

            if (data?.itens?.length > 0) {
                renderCartItems(data.itens);
                updateCartSummary(data.total || data.getTotal?.() || 0);
            } else {
                showCartEmptyState('Seu carrinho está vazio');
            }

        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            showCartEmptyState('Erro ao carregar carrinho. Tente novamente mais tarde.');
        }
    }

    // ========== RENDERIZAR ITENS DO CARRINHO ==========
    function renderCartItems(items) {
        const cartContent = document.querySelector('.cart-content');

        if (!cartContent) {
            console.error('Elemento do carrinho não encontrado');
            return;
        }

        // Limpa container
        cartContent.innerHTML = '';

        // Cria container de itens
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'cart-items-container';
        itemsContainer.innerHTML = `
            <div class="cart-items" id="cart-items-list"></div>
            <div class="cart-summary">
                <h3>Resumo do Pedido</h3>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span class="value" id="subtotal">R$ 0,00</span>
                </div>
                <div class="summary-row">
                    <span>Frete</span>
                    <span class="value">R$ 0,00</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span class="value" id="total">R$ 0,00</span>
                </div>
                <button id="btn-finalizar-compra" class="btn btn-primary btn-block">
                    <i class="fas fa-shopping-bag"></i> Finalizar Compra
                </button>
            </div>
        `;
        cartContent.appendChild(itemsContainer);

        const cartItemsList = document.getElementById('cart-items-list');

        items.forEach(item => {
            const cartItemHTML = `
                <div class="cart-item" data-item-id="${item.id}">
                    <img src="${item.produtoFotoUrl || item.fotoUrl || '/imagens/placeholder.png'}"
                         alt="${item.produtoNome || item.nome || 'Produto'}"
                         class="cart-item-img"
                         onerror="this.src='/imagens/placeholder.png'">

                    <div class="cart-item-info">
                        <h3>${item.produtoNome || item.nome || 'Produto Demo'}</h3>
                        <p class="cart-item-desc">${item.produtoDescricao || item.descricao || 'Descrição do produto'}</p>
                        <div class="cart-item-price">R$ ${(item.precoUnitario || item.preco || 0).toFixed(2)}</div>

                        <div class="cart-item-quantity">
                            <button class="quantity-btn quantity-minus" data-item-id="${item.id}">-</button>

                            <input type="number"
                                   class="quantity-input"
                                   value="${item.quantidade || 1}"
                                   min="1"
                                   max="${item.produtoQuantidadeDisponivel || item.quantidadeDisponivel || 99}"
                                   data-item-id="${item.id}">

                            <button class="quantity-btn quantity-plus" data-item-id="${item.id}">+</button>
                        </div>
                    </div>

                    <div class="cart-item-actions">
                        <button class="btn-remove" data-item-id="${item.id}">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                </div>
            `;

            cartItemsList.insertAdjacentHTML('beforeend', cartItemHTML);
        });

        addCartItemEvents();
        setupFinalizarCompra();
    }

    // ========== MOSTRAR CARRINHO VAZIO ==========
    function showCartEmptyState(message = 'Seu carrinho está vazio') {
        const cartContent = document.querySelector('.cart-content');
        if (!cartContent) return;

        cartContent.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart fa-4x"></i>
                <h2>${message}</h2>
                <p>Adicione produtos ao carrinho para finalizar sua compra</p>
                <a href="/" class="btn btn-primary mt-20">
                    <i class="fas fa-shopping-bag"></i> Continuar Comprando
                </a>
            </div>
        `;
    }

    // ========== RESUMO DO CARRINHO ==========
    function updateCartSummary(total) {
        const subtotalElement = document.getElementById('subtotal');
        const totalElement = document.getElementById('total');

        if (subtotalElement) subtotalElement.textContent = `R$ ${(total || 0).toFixed(2)}`;
        if (totalElement) totalElement.textContent = `R$ ${(total || 0).toFixed(2)}`;
    }

    // ========== EVENTOS DOS ITENS ==========
    function addCartItemEvents() {
        // Botões de quantidade
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.itemId;
                const input = this.closest('.cart-item-quantity').querySelector('.quantity-input');

                let value = parseInt(input.value) || 1;
                const max = parseInt(input.max) || 99;

                if (this.classList.contains('quantity-minus')) {
                    value = Math.max(1, value - 1);
                } else if (this.classList.contains('quantity-plus')) {
                    value = Math.min(max, value + 1);
                }

                input.value = value;
                updateCartItemQuantity(itemId, value);
            });
        });

        // Mudança manual
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const value = Math.max(
                    parseInt(this.min) || 1,
                    Math.min(parseInt(this.max) || 99, parseInt(this.value) || 1)
                );

                this.value = value;
                updateCartItemQuantity(this.dataset.itemId, value);
            });
        });

        // Botão remover
        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', function() {
                removeCartItem(this.dataset.itemId);
            });
        });
    }

    // ========== ATUALIZAR QUANTIDADE ==========
    async function updateCartItemQuantity(itemId, quantidade) {
        try {
            console.log(`Atualizando item ${itemId} para quantidade ${quantidade}`);

            const response = await fetch(`/api/carrinho/itens/${itemId}?quantidade=${quantidade}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar quantidade');
            }

            const data = await response.json();

            // Atualiza visualmente o item específico
            const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
            if (cartItem) {
                const itemData = data.itens?.find(item => item.id == itemId);
                if (itemData) {
                    const price = itemData.precoUnitario || itemData.preco || 0;
                    const subtotal = price * quantidade;

                    cartItem.querySelector('.cart-item-price').textContent = `R$ ${subtotal.toFixed(2)}`;
                }
            }

            // Atualiza resumo
            updateCartSummary(data.total || data.getTotal?.() || 0);

            showNotification('Quantidade atualizada', 'success');

        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            showNotification('Erro ao atualizar quantidade', 'error');
        }
    }

    // ========== REMOVER ITEM ==========
    async function removeCartItem(itemId) {
        if (!confirm('Deseja remover este item do carrinho?')) return;

        try {
            console.log(`Removendo item ${itemId}`);

            const response = await fetch(`/api/carrinho/itens/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao remover item');
            }

            document.querySelector(`.cart-item[data-item-id="${itemId}"]`)?.remove();

            showNotification('Item removido do carrinho', 'success');

            // Atualiza contador global
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }

            // Se não houver mais itens, mostra estado vazio
            if (document.querySelectorAll('.cart-item').length === 0) {
                showCartEmptyState();
            } else {
                // Recarrega o carrinho para atualizar o total
                const data = await response.json();
                updateCartSummary(data.total || data.getTotal?.() || 0);
            }

        } catch (error) {
            console.error('Erro ao remover item:', error);
            showNotification('Erro ao remover item', 'error');
        }
    }

    // ========== FINALIZAR COMPRA ==========
    function setupFinalizarCompra() {
        const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
        if (btnFinalizarCompra) {
            btnFinalizarCompra.addEventListener('click', () => {
                if (!localStorage.getItem('jwtToken')) {
                    showNotification('Você precisa estar logado!', 'error');
                    return window.location.href = '/login?redirect=/carrinho';
                }

                if (document.querySelectorAll('.cart-item').length === 0) {
                    return showNotification('Seu carrinho está vazio!', 'error');
                }

                showNotification('Compra finalizada com sucesso! (Demonstração)', 'success');

                // Limpa carrinho após compra
                setTimeout(() => {
                    showCartEmptyState('Compra realizada! Seu carrinho está vazio.');
                }, 2000);
            });
        }
    }

    // ========== FUNÇÃO AUXILIAR PARA NOTIFICAÇÕES ==========
    function showNotification(message, type = 'info') {
        // Remove notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Adiciona ao body
        document.body.appendChild(notification);

        // Remove após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        return notification;
    }

    // ========== INICIALIZAÇÃO ==========
    console.log('Iniciando carrinho...');
    loadCartItems();
});