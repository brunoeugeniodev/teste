// ========== AUTH INTERCEPTOR ==========
(function() {
    'use strict';

    console.log('Auth Interceptor carregado');

    // Intercepta todas as requisições fetch
    const originalFetch = window.fetch;

    window.fetch = async function(url, options = {}) {
        console.log(`Fetch interceptado: ${url}`);

        // Configurações padrão
        const config = {
            ...options,
            headers: {
                ...options.headers,
                'Accept': 'application/json'
            }
        };

        // Adiciona token se disponível (exceto para login/registro)
        const isAuthEndpoint = url.includes('/api/auth/login') ||
                               url.includes('/api/auth/registro') ||
                               url.includes('/api/auth/logout');

        if (!isAuthEndpoint) {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
                console.log(`Token adicionado à requisição para: ${url}`);
            } else {
                console.log(`Nenhum token encontrado para: ${url}`);
            }
        }

        // Faz a requisição
        const response = await originalFetch.call(this, url, config);

        // Verifica se token expirou (401 Unauthorized)
        if (response.status === 401 && !url.includes('/api/auth/login')) {
            console.log('Token expirado ou inválido. Redirecionando para login...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');

            // Redireciona para login
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return response;
        }

        return response;
    };

    // Adiciona função global para verificar autenticação
    window.checkAuth = function() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('authUser');

        if (token && user) {
            try {
                return {
                    isAuthenticated: true,
                    token: token,
                    user: JSON.parse(user)
                };
            } catch (e) {
                console.error('Erro ao parsear usuário:', e);
                return { isAuthenticated: false };
            }
        }
        return { isAuthenticated: false };
    };

    // Adiciona função global para logout
    window.logout = async function() {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/login';
        }
    };

    console.log('Auth Interceptor configurado com sucesso');
})();