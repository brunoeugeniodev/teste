// ========== CADASTRO LOJA PAGE - Scripts específicos ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Cadastro loja page - Script carregado');

    // ========== VERIFICAÇÃO DE LOGIN ==========
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert('Você precisa estar logado para cadastrar uma loja!');
        window.location.href = '/login?redirect=' + encodeURIComponent('/cadastro-loja');
        return;
    }

    // ========== LÓGICA DO FORMULÁRIO PASSO A PASSO ==========
    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');
    let currentStep = 0;

    // Mostrar passo específico
    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index === stepIndex) {
                indicator.classList.add('active');
            } else if (index < stepIndex) {
                indicator.classList.add('completed');
            }
        });

        currentStep = stepIndex;
    }

    // Validação de passo
    function validateStep(stepIndex) {
        const currentFormStep = formSteps[stepIndex];
        const requiredInputs = currentFormStep.querySelectorAll('[required]');

        for (let input of requiredInputs) {
            if (!input.value.trim()) {
                const label = input.previousElementSibling?.textContent || 'campo obrigatório';
                showNotification(`Por favor, preencha o campo: ${label}`, 'error');
                input.focus();
                return false;
            }
        }

        // Validação específica do CNPJ
        if (stepIndex === 0) {
            const cnpjInput = document.getElementById('cnpj');
            if (cnpjInput && !validarCNPJ(cnpjInput.value)) {
                showNotification('CNPJ inválido! Por favor, verifique o número.', 'error');
                cnpjInput.focus();
                return false;
            }
        }

        return true;
    }

    // Função para validar CNPJ
    function validarCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, '');

        if (cnpj.length !== 14) return false;

        // Elimina CNPJs invalidos conhecidos
        if (cnpj === "00000000000000" ||
            cnpj === "11111111111111" ||
            cnpj === "22222222222222" ||
            cnpj === "33333333333333" ||
            cnpj === "44444444444444" ||
            cnpj === "55555555555555" ||
            cnpj === "66666666666666" ||
            cnpj === "77777777777777" ||
            cnpj === "88888888888888" ||
            cnpj === "99999999999999")
            return false;

        // Valida DVs
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0)) return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1)) return false;

        return true;
    }

    // Botões próximo/anterior
    document.querySelectorAll('.btn-next').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (validateStep(currentStep)) {
                if (currentStep < formSteps.length - 1) {
                    showStep(currentStep + 1);
                }
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep > 0) {
                showStep(currentStep - 1);
            }
        });
    });

    // ========== UPLOAD DE IMAGEM ==========
    const fileUploads = document.querySelectorAll('.file-upload');
    fileUploads.forEach(upload => {
        const input = upload.querySelector('input[type="file"]');
        const preview = upload.querySelector('.preview-image');

        if (upload && input) {
            upload.addEventListener('click', () => input.click());

            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Validação do arquivo
                    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                    const maxSize = 5 * 1024 * 1024; // 5MB

                    if (!validTypes.includes(file.type)) {
                        showNotification('Formato de arquivo inválido. Use JPG ou PNG.', 'error');
                        return;
                    }

                    if (file.size > maxSize) {
                        showNotification('Arquivo muito grande. Máximo 5MB.', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        if (preview) {
                            preview.src = e.target.result;
                            preview.style.display = 'block';
                        }
                        const icon = upload.querySelector('i');
                        const text = upload.querySelector('p');
                        if (icon) icon.style.display = 'none';
                        if (text) text.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });

    // ========== SUBMIT DO FORMULÁRIO ==========
    const storeForm = document.getElementById('store-form');
    if (storeForm) {
        storeForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!validateStep(currentStep)) {
                showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }

            const button = this.querySelector('.btn-submit');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            button.disabled = true;

            // Coleta dados do formulário
            const lojaData = {
                nome: document.getElementById('nome-loja').value,
                cnpj: document.getElementById('cnpj').value.replace(/\D/g, ''),
                descricao: document.getElementById('descricao').value,
                telefone: document.getElementById('telefone')?.value?.replace(/\D/g, '') || '',
                email: document.getElementById('email-loja')?.value || '',
                site: document.getElementById('site')?.value || '',
                endereco: {
                    rua: document.getElementById('logradouro').value,
                    numero: document.getElementById('numero').value,
                    bairro: document.getElementById('bairro').value,
                    cidade: document.getElementById('cidade').value,
                    estado: document.getElementById('estado').value,
                    cep: document.getElementById('cep').value.replace(/\D/g, ''),
                    complemento: document.getElementById('complemento')?.value || ''
                }
            };

            console.log('Enviando dados da loja:', lojaData);

            // Envia para API
            fetch('/api/lojas', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(lojaData)
            })
            .then(response => {
                console.log('Status da resposta:', response.status);

                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Erro response text:', text);
                        try {
                            const data = JSON.parse(text);
                            throw new Error(data.error || data.message || `Erro ${response.status} ao cadastrar loja`);
                        } catch (e) {
                            // Se não conseguir parsear JSON, mostra texto puro
                            throw new Error(text || `Erro ${response.status} ao cadastrar loja`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Loja criada com sucesso:', data);
                showNotification('Loja cadastrada com sucesso!', 'success');

                // Se houver foto, faz upload separado
                const fotoFile = document.getElementById('logo-loja').files[0];
                if (fotoFile && data.id) {
                    return uploadFotoLoja(data.id, fotoFile, token);
                }
                return Promise.resolve();
            })
            .then(() => {
                setTimeout(() => {
                    window.location.href = '/minha-loja';
                }, 2000);
            })
            .catch(error => {
                console.error('Erro completo:', error);
                showNotification('Erro ao cadastrar loja: ' + error.message, 'error');
                button.innerHTML = originalText;
                button.disabled = false;

                // Se erro 401 (não autorizado), redireciona para login
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    setTimeout(() => {
                        localStorage.removeItem('jwtToken');
                        window.location.href = '/login?redirect=' + encodeURIComponent('/cadastro-loja');
                    }, 3000);
                }
            });
        });
    }

    // Função para upload da foto da loja
    function uploadFotoLoja(lojaId, fotoFile, token) {
        const formData = new FormData();
        formData.append('foto', fotoFile);

        return fetch(`/api/lojas/${lojaId}/foto`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                console.warn('Foto não pôde ser atualizada, mas a loja foi criada');
                return Promise.resolve();
            }
            return response.json();
        })
        .then(data => {
            console.log('Foto atualizada:', data);
            return data;
        })
        .catch(() => {
            console.log('Erro ao enviar foto (ignorado para demo)');
            return Promise.resolve();
        });
    }

    // ========== BUSCAR CEP AUTOMATICAMENTE ==========
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarEnderecoPorCEP(cep);
            }
        });
    }

    // Função para buscar CEP
    function buscarEnderecoPorCEP(cep) {
        console.log('Buscando CEP:', cep);

        // Remove qualquer máscara
        cep = cep.replace(/\D/g, '');

        // Verifica se CEP tem 8 dígitos
        if (cep.length !== 8) {
            showNotification('CEP deve ter 8 dígitos', 'error');
            return;
        }

        // Mostra loading
        showNotification('Buscando endereço...', 'info');

        // Faz requisição para API ViaCEP
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    throw new Error('CEP não encontrado');
                }

                // Preenche os campos
                document.getElementById('logradouro').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';

                // Foca no campo número após preenchimento
                document.getElementById('numero').focus();

                showNotification('Endereço encontrado com sucesso!', 'success');
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
                showNotification('Erro ao buscar CEP: ' + error.message, 'error');
            });
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

    // ========== CONTADOR DE CARACTERES ==========
    const descricaoTextarea = document.getElementById('descricao');
    if (descricaoTextarea) {
        const charCounter = document.getElementById('descricao-chars');

        descricaoTextarea.addEventListener('input', function() {
            const count = this.value.length;
            if (charCounter) {
                charCounter.textContent = count;

                // Altera cor se estiver perto do limite
                if (count > 450) {
                    charCounter.style.color = '#e74c3c';
                } else if (count > 400) {
                    charCounter.style.color = '#f39c12';
                } else {
                    charCounter.style.color = '#7f8c8d';
                }
            }
        });
    }

    // ========== MÁSCARA DE CNPJ ==========
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length <= 2) {
                value = value.replace(/^(\d{0,2})/, '$1');
            } else if (value.length <= 5) {
                value = value.replace(/^(\d{0,2})(\d{0,3})/, '$1.$2');
            } else if (value.length <= 8) {
                value = value.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})/, '$1.$2.$3');
            } else if (value.length <= 12) {
                value = value.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})/, '$1.$2.$3/$4');
            } else {
                value = value.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/, '$1.$2.$3/$4-$5');
            }

            e.target.value = value;
        });
    }

    // ========== MÁSCARA DE TELEFONE ==========
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length <= 10) {
                value = value.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
            }

            e.target.value = value;
        });
    }

    // ========== MÁSCARA DE CEP ==========
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length <= 5) {
                value = value.replace(/^(\d{0,5})/, '$1');
            } else {
                value = value.replace(/^(\d{0,5})(\d{0,3})/, '$1-$2');
            }

            e.target.value = value;
        });
    }

    // ========== BOTÃO BUSCAR CEP ==========
    const btnBuscarCep = document.getElementById('btn-buscar-cep');
    if (btnBuscarCep) {
        btnBuscarCep.addEventListener('click', function() {
            const cep = document.getElementById('cep').value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarEnderecoPorCEP(cep);
            } else {
                showNotification('Digite um CEP válido com 8 dígitos', 'error');
                document.getElementById('cep').focus();
            }
        });
    }

    console.log('Cadastro loja page scripts inicializados');
});