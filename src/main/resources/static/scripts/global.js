// ========== INTERCEPTOR GLOBAL ==========
(function() {
    const originalFetch = window.fetch;

    window.fetch = async function(url, options = {}) {
        // Adiciona token em todas as requisições exceto login/registro
        const isAuthEndpoint = url.includes('/api/auth/login') ||
                              url.includes('/api/auth/registro');

        if (!isAuthEndpoint) {
            const token = localStorage.getItem('jwtToken');
            if (token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
        }

        // Garante Content-Type para POST/PUT se não for FormData
        if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
            if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
                options.headers = {
                    ...options.headers,
                    'Content-Type': 'application/json'
                };
            }
        }

        return originalFetch.call(this, url, options);
    };
})();

// ================= UTILITÁRIOS JWT =================

// Decodifica payload do JWT (sem validar assinatura) e retorna objeto ou null
window.parseJwtPayload = function(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(atob(payload).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(json);
    } catch (e) {
        console.error('Falha ao decodificar JWT:', e);
        return null;
    }
};

window.isTokenExpired = function(token) {
    const payload = window.parseJwtPayload(token);
    if (!payload || !payload.exp) return true; // considerado expirado se não souber
    const expMillis = payload.exp * 1000;
    return Date.now() >= expMillis;
};

// ================= HEADERS DE AUTENTICAÇÃO =================

// Retorna apenas o header Authorization (não inclui Content-Type para evitar duplicação)
window.getAuthHeader = function() {
    const token = localStorage.getItem('jwtToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ================= LOGIN / LOGOUT =================

// Fazer login e salvar token + usuário
window.fazerLoginCompleto = async function(email, senha) {
    try {
        console.log('Tentando login para:', email);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Credenciais inválidas');
        }

        const data = await response.json();
        console.log('Login response:', data);

        if (!data.token) {
            throw new Error('Token não recebido do servidor');
        }

        // SALVAR TOKEN
        localStorage.setItem('jwtToken', data.token);

        // SALVAR DADOS DO USUÁRIO
        const userData = {
            email: data.email,
            nome: data.nome,
            roles: data.roles || ['ROLE_USER']
        };
        localStorage.setItem('usuario', JSON.stringify(userData));

        console.log('Login realizado com sucesso!');

        // Atualizar UI
        updateUserDropdown();
        loadCartCount();

        // Redirecionar
        setTimeout(() => {
            window.location.href = '/';
        }, 500);

        return data;

    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
};
window.fazerLogin = window.fazerLoginCompleto;

// Fazer logout (limpa localStorage e tenta notificar backend)
window.fazerLogoutCompleto = async function() {
    try {
        // Tenta falar com backend — falha não impede logout local
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...window.getAuthHeader()
            }
        });
    } catch (error) {
        console.warn('Logout no backend falhou ou endpoint não existe:', error);
    }

    // Limpar localStorage
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('usuario');

    // Atualizar UI
    updateUserDropdown();
    loadCartCount();

    window.showNotification('Logout realizado com sucesso!', 'success');

    // Redireciona à home
    setTimeout(() => {
        window.location.href = '/';
    }, 600);
};
window.fazerLogout = window.fazerLogoutCompleto;

// ================= CARRINHO (contagem) =================

window.loadCartCount = function() {
    const token = localStorage.getItem('jwtToken');
    const cartCountElement = document.getElementById('cart-count');

    if (!token) {
        if (cartCountElement) cartCountElement.textContent = '0';
        return;
    }

    fetch('/api/carrinho', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            ...window.getAuthHeader()
        }
    })
    .then(async response => {
        if (!response.ok) {
            // Se 401/403 => usuário não autorizado -> mostrar 0 sem quebrar
            if (response.status === 401 || response.status === 403) {
                return { totalItens: 0 };
            }
            // Tentar json, se error, fallback
            try {
                return await response.json();
            } catch (e) {
                return { totalItens: 0 };
            }
        }
        return response.json();
    })
    .then(data => {
        if (cartCountElement) {
            cartCountElement.textContent = String(data.totalItens || 0);
        }
    })
    .catch(error => {
        console.error("Não foi possível carregar contagem do carrinho:", error);
        if (cartCountElement) cartCountElement.textContent = '0';
    });
};

// ================= NOTIFICAÇÕES =================

window.showNotification = function(message, type = 'success') {
    // Remove notificações antigas
    const oldAlerts = document.querySelectorAll('.global-notification');
    oldAlerts.forEach(alert => {
        if (alert.parentElement) alert.parentElement.remove();
    });

    const notification = document.createElement('div');
    notification.className = `global-notification alert alert-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" aria-hidden="true"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto;">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
    `;
    document.body.appendChild(notification);
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '10000',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        padding: '15px',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    });

    // Adiciona estilos dinâmicos baseados no tipo
    if (type === 'success') {
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
        notification.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
        notification.style.border = '1px solid #f5c6cb';
    } else {
        notification.style.backgroundColor = '#d1ecf1';
        notification.style.color = '#0c5460';
        notification.style.border = '1px solid #bee5eb';
    }

    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 5000);
};

// ================= MÁSCARAS e BUSCA CEP =================

window.aplicarMascaraCPF = function(cpfInput) {
    if (!cpfInput) return;
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        }
    });
};

window.aplicarMascaraCNPJ = function(cnpjInput) {
    if (!cnpjInput) return;
    cnpjInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d)/, '$1/$2')
                         .replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        }
    });
};

window.aplicarMascaraTelefone = function(telInput) {
    if (!telInput) return;
    telInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2')
                         .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            value = value.replace(/(\d{2})(\d)/, '($1) $2')
                         .replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
};

window.aplicarMascaraCEP = function(cepInput) {
    if (!cepInput) return;
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 8) {
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
            // buscar quando tiver 8 dígitos (sem hífen)
            if (value.replace(/\D/g, '').length === 8) {
                window.buscarEnderecoPorCEP(value);
            }
        }
    });
};

window.buscarEnderecoPorCEP = function(cep) {
    const cepLimpo = String(cep).replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then(resp => resp.json())
        .then(data => {
            if (!data.erro) {
                const logradouroInput = document.getElementById('logradouro');
                const bairroInput = document.getElementById('bairro');
                const cidadeInput = document.getElementById('cidade');
                const estadoInput = document.getElementById('estado');
                if (logradouroInput) logradouroInput.value = data.logradouro || '';
                if (bairroInput) bairroInput.value = data.bairro || '';
                if (cidadeInput) cidadeInput.value = data.localidade || '';
                if (estadoInput) estadoInput.value = data.uf || '';
                if (window.showNotification) window.showNotification('Endereço preenchido automaticamente!', 'success');
            }
        })
        .catch(err => console.error('Erro ao buscar CEP:', err));
};

// ================= AJAX HELPER =================

window.ajaxRequest = function(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        // montar headers sem duplicar Content-Type
        const auth = window.getAuthHeader ? window.getAuthHeader() : {};
        const headers = {
            'Accept': 'application/json',
            ...auth
        };

        const options = { method, headers };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            if (!(data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            } else {
                // FormData não precisa de Content-Type, o navegador define
                options.body = data;
            }
        }

        fetch(url, options)
            .then(async response => {
                // tratar respostas 204 / empty
                if (response.status === 204) return resolve(null);
                const text = await response.text().catch(()=>null);
                if (!response.ok) {
                    // tentar extrair mensagem do body (json ou text)
                    let errMsg = `HTTP error! status: ${response.status}`;
                    try {
                        const json = text ? JSON.parse(text) : null;
                        if (json && json.message) errMsg = json.message;
                    } catch (e) {
                        if (text) errMsg = text;
                    }
                    throw new Error(errMsg);
                }
                // se veio texto vazio
                if (!text) return resolve(null);
                try {
                    const json = JSON.parse(text);
                    return resolve(json);
                } catch (e) {
                    // não era JSON
                    return resolve(text);
                }
            })
            .catch(error => reject(error));
    });
};

// ================= DROPDOWN DO USUÁRIO =================

window.updateUserDropdown = function() {
    const token = localStorage.getItem('jwtToken');
    const userDropdown = document.getElementById('user-dropdown');
    const authButtons = document.getElementById('auth-buttons');

    if (!userDropdown || !authButtons) return;

    if (token) {
        userDropdown.style.display = 'block';
        authButtons.style.display = 'none';

        try {
            // Preferir dados do localStorage; se não tiver, extrai do token
            const usuarioStorage = JSON.parse(localStorage.getItem('usuario') || '{}');
            const userNameElement = document.getElementById('user-name');

            const payload = window.parseJwtPayload(token);
            const username = usuarioStorage.username || usuarioStorage.nome ||
                           (payload && (payload.sub || payload.username)) || 'Usuário';

            if (userNameElement) userNameElement.textContent = username;

            // Mostrar "Minha Loja" apenas se o usuário tiver role VENDEDOR
            const minhaLojaLink = document.getElementById('minha-loja-link');
            const roles = usuarioStorage.roles || (payload && (payload.roles || payload.authorities)) || [];
            const rolesNormalized = Array.isArray(roles) ? roles.map(r => String(r).toUpperCase()) : [String(roles).toUpperCase()];

            const hasVendedorRole = rolesNormalized.some(r => r.includes('VENDEDOR') || r.includes('ROLE_VENDEDOR') || r.includes('ROLE_SELLER'));
            if (minhaLojaLink) minhaLojaLink.style.display = hasVendedorRole ? 'block' : 'none';

        } catch (e) {
            console.error('Erro ao processar dados do usuário:', e);
        }
    } else {
        userDropdown.style.display = 'none';
        authButtons.style.display = 'flex';
    }
};

// ================= VERIFICAR TOKEN =================

// Tenta validar com backend; se endpoint não existir, faz fallback para verificar exp no token
window.verifyToken = async function() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;

    try {
        const response = await fetch('/api/auth/validate-token', {
            method: 'GET',
            headers: { ...window.getAuthHeader(), 'Accept': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json().catch(()=>({}));
            if (typeof data.valid !== 'undefined') return data.valid === true;
            // Se backend respondeu OK mas sem field valid, assumir OK
            return true;
        } else {
            // se 404 => endpoint não existe -> fallback para checar exp localmente
            if (response.status === 404) {
                return !window.isTokenExpired(token);
            }
            return false;
        }
    } catch (error) {
        // fallback: verificar exp localmente
        console.warn('verifyToken: falha ao verificar no backend, usando fallback local', error);
        return !window.isTokenExpired(token);
    }
};

// ================= CHECK LOGIN AO INICIAR =================

window.checkLoginStatus = async function() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        // sem token: garantir UI consistente
        localStorage.removeItem('usuario');
        updateUserDropdown();
        return;
    }

    // se token expirado localmente, deslogar
    if (window.isTokenExpired(token)) {
        // tentar logout silencioso e limpar
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('usuario');
        updateUserDropdown();
        window.showNotification('Sua sessão expirou. Faça login novamente.', 'warning');
        return;
    }

    // tentar verificação com backend; se inválido, deslogar local
    const valid = await window.verifyToken();
    if (!valid) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('usuario');
        updateUserDropdown();
        window.showNotification('Sessão inválida. Faça login novamente.', 'warning');
        return;
    }

    // atualizar UI
    updateUserDropdown();
};

// ================= EVENTOS GLOBAIS E INICIALIZAÇÃO =================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Na Loja Tem - Scripts globais carregados');

    // Verificar status do login
    window.checkLoginStatus().catch(error => {
        console.error('Erro ao verificar status do login:', error);
    });

    // MENU MOBILE
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('show');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    // BARRA DE PESQUISA
    const searchButton = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function(e) {
            // permitir submit normal do form (melhor para acessibilidade)
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // deixa o form submeter normalmente
            }
        });
    }

    // INICIALIZAÇÃO DAS MÁSCARAS
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) aplicarMascaraCPF(cpfInput);

    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) aplicarMascaraTelefone(telefoneInput);

    const cepInput = document.getElementById('cep');
    if (cepInput) aplicarMascaraCEP(cepInput);

    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) aplicarMascaraCNPJ(cnpjInput);

    // INICIALIZAR DROPDOWN DO USUÁRIO
    updateUserDropdown();

    // Toggle do dropdown no botão do usuário
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdownContent = document.getElementById('dropdown-content');
            if (dropdownContent) {
                const isOpen = dropdownContent.style.display === 'block';
                dropdownContent.style.display = isOpen ? 'none' : 'block';
                userMenuBtn.setAttribute('aria-expanded', String(!isOpen));
            }
        });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function() {
        const dropdownContent = document.getElementById('dropdown-content');
        if (dropdownContent) dropdownContent.style.display = 'none';
    });

    // Prevenir fechamento ao clicar dentro do dropdown
    const dropdownContent = document.getElementById('dropdown-content');
    if (dropdownContent) {
        dropdownContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Logout do dropdown
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.fazerLogout();
        });
    }

    // CARREGAR CONTAGEM DO CARRINHO
    loadCartCount();

    // ADICIONAR AO CARRINHO (delegação)
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-comprar, .btn-buy-sm');
        if (button) {
            e.preventDefault();
            const produtoId = button.getAttribute('data-produto-id');
            if (!produtoId) {
                console.error("ID do produto não encontrado.");
                window.showNotification('Erro: Produto inválido.', 'error');
                return;
            }
            addToCart(produtoId);
        }
    });

    async function addToCart(produtoId) {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.showNotification('Você precisa estar logado para adicionar itens ao carrinho.', 'error');
            setTimeout(() => {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1200);
            return;
        }

        try {
            const resp = await fetch('/api/carrinho/itens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.getAuthHeader()
                },
                body: JSON.stringify({ produtoId: produtoId, quantidade: 1 })
            });

            if (resp.status === 401 || resp.status === 403) {
                window.showNotification('Você precisa estar logado para adicionar itens ao carrinho.', 'error');
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('usuario');
                updateUserDropdown();
                setTimeout(() => {
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                }, 1200);
                return;
            }

            if (!resp.ok) {
                const text = await resp.text().catch(()=>null);
                throw new Error(text || 'Erro ao adicionar produto ao carrinho.');
            }

            // atualizar contagem
            loadCartCount();
            window.showNotification('Produto adicionado ao carrinho!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            window.showNotification('Ocorreu um erro ao adicionar o produto.', 'error');
        }
    }

    // FAVORITOS (delegação)
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-favorito, .btn-fav-sm');
        if (button) {
            e.preventDefault();
            toggleFavorite(button);
        }
    });

    async function toggleFavorite(button) {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.showNotification('Você precisa estar logado para favoritar produtos.', 'error');
            setTimeout(() => {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1200);
            return;
        }

        const isActive = button.classList.contains('ativo');
        const icon = button.querySelector('i');

        // Alternar visualmente já para feedback rápido
        button.classList.toggle('ativo');
        if (icon) {
            icon.classList.toggle('fas');
            icon.classList.toggle('far');
        }

        const produtoId = button.getAttribute('data-produto-id');
        if (!produtoId) {
            window.showNotification('Produto inválido para favoritos.', 'error');
            // reverter visual
            button.classList.toggle('ativo');
            if (icon) icon.classList.toggle('fas') || icon.classList.toggle('far');
            return;
        }

        try {
            const action = isActive ? 'remover' : 'adicionar';
            const method = isActive ? 'DELETE' : 'POST';
            const resp = await fetch(`/api/favoritos/${action}/${produtoId}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...window.getAuthHeader()
                }
            });

            if (resp.status === 401 || resp.status === 403) {
                window.showNotification('Sua sessão expirou. Faça login novamente.', 'error');
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('usuario');
                updateUserDropdown();
                // reverter visual
                button.classList.toggle('ativo');
                if (icon) icon.classList.toggle('fas') || icon.classList.toggle('far');
                return;
            }

            if (!resp.ok) {
                throw new Error('Falha ao atualizar favoritos');
            }

            window.showNotification(isActive ? 'Produto removido dos favoritos' : 'Produto adicionado aos favoritos', 'success');
        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            // Reverter visualmente se der erro
            button.classList.toggle('ativo');
            if (icon) {
                icon.classList.toggle('fas');
                icon.classList.toggle('far');
            }
            window.showNotification('Não foi possível atualizar favoritos.', 'error');
        }
    }

    console.log('Scripts globais inicializados com sucesso');
});