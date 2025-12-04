// ========== DEBUG GLOBAL ==========
window.debugAuth = function() {
    const token = localStorage.getItem('jwtToken') || localStorage.getItem('jwt');

    console.log('=== DEBUG AUTENTICAÇÃO ===');
    console.log('LocalStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }

    if (token) {
        console.log('Token encontrado:', token.substring(0, 50) + '...');

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Payload decodificado:', payload);
        } catch (e) {
            console.error('Erro ao decodificar token:', e);
        }

        // Testa com API
        fetch('/api/debug/auth', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => console.log('Resposta da API:', data))
        .catch(err => console.error('Erro na API:', err));
    } else {
        console.warn('Nenhum token encontrado!');
    }
};

// Executa automaticamente em páginas que precisam de auth
if (window.location.pathname.includes('/cadastro-loja') ||
    window.location.pathname.includes('/minha-conta') ||
    window.location.pathname.includes('/minha-loja')) {

    setTimeout(() => {
        console.log('Debug automático para página protegida:');
        window.debugAuth();
    }, 1000);
}