// ========== LOGIN PAGE - Scripts específicos ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page - Script carregado');

    // Verifica se já está logado
    const token = localStorage.getItem('jwtToken');
    if (token) {
        // Se já tem token, redireciona para home
        console.log('Usuário já logado, redirecionando...');
        window.location.href = '/';
        return;
    }

    // ========== TOGGLE VISIBILIDADE DA SENHA ==========
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // ========== FORMULÁRIO DE LOGIN ==========
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const button = document.getElementById('login-button');
            const messageDiv = document.getElementById('login-message');

            // Validação básica
            if (!email || !password) {
                if (messageDiv) {
                    messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Email e senha são obrigatórios';
                    messageDiv.className = 'alert alert-error';
                    messageDiv.style.display = 'block';
                }
                return;
            }

            // Validação de formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (messageDiv) {
                    messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Por favor, insira um email válido';
                    messageDiv.className = 'alert alert-error';
                    messageDiv.style.display = 'block';
                }
                return;
            }

            // Salva estado do botão
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            button.disabled = true;

            // Limpa mensagem anterior
            if (messageDiv) {
                messageDiv.style.display = 'none';
            }

            try {
                console.log('Tentando login com:', { email, password: '***' });

                // Usa a função global fazerLogin que já existe
                await window.fazerLoginCompleto(email, password);

                // Se chegou aqui, o login foi bem-sucedido
                // A função fazerLoginCompleto já redireciona automaticamente
                // Mas podemos mostrar uma mensagem de sucesso
                if (messageDiv) {
                    messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> Login realizado com sucesso! Redirecionando...';
                    messageDiv.className = 'alert alert-success';
                    messageDiv.style.display = 'block';
                }

            } catch (error) {
                console.error('Erro no login:', error);

                // Restaura botão
                button.innerHTML = originalText;
                button.disabled = false;

                // Mostra mensagem de erro
                let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

                if (error.message.includes('Credenciais inválidas') ||
                    error.message.includes('usuário não encontrado') ||
                    error.message.includes('senha incorreta')) {
                    errorMessage = 'Email ou senha incorretos. Tente novamente.';
                } else if (error.message.includes('conexão') || error.message.includes('network')) {
                    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
                } else {
                    errorMessage = error.message || errorMessage;
                }

                if (messageDiv) {
                    messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
                    messageDiv.className = 'alert alert-error';
                    messageDiv.style.display = 'block';
                }
            }
        });
    }

    // ========== ESQUECI MINHA SENHA ==========
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Funcionalidade em desenvolvimento! Em breve você poderá recuperar sua senha.');
        });
    }

    // ========== LOGIN SOCIAL (placeholders) ==========
    const googleButton = document.querySelector('.btn-google');
    const facebookButton = document.querySelector('.btn-facebook');

    if (googleButton) {
        googleButton.addEventListener('click', function() {
            alert('Login com Google em desenvolvimento!');
        });
    }

    if (facebookButton) {
        facebookButton.addEventListener('click', function() {
            alert('Login com Facebook em desenvolvimento!');
        });
    }

    // ========== AUTO-FOCUS NO EMAIL ==========
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.focus();
    }

    console.log('Login page scripts inicializados');
});