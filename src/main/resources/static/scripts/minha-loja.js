// ========== MINHA LOJA (Dashboard) PAGE - Scripts específicos ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Minha loja page - Script carregado');

    // ========== VERIFICAÇÃO DE LOGIN ==========
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert('Você precisa estar logado para acessar esta página!');
        window.location.href = '/login?redirect=' + encodeURIComponent('/minha-loja');
        return;
    }

    // ========== CARREGAR DADOS DO DASHBOARD ==========
    async function loadDashboardData() {
        try {
            console.log('Carregando dados do dashboard...');

            // Verificar se usuário tem loja
            const response = await fetch('/api/minha-loja/verificar', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('usuario');
                window.location.href = '/login?redirect=' + encodeURIComponent('/minha-loja');
                return;
            }

            if (!response.ok) {
                console.error('Erro ao verificar loja');
                showNoStoreMessage();
                return;
            }

            const data = await response.json();

            if (data.temLoja) {
                // Usuário tem loja - carregar dashboard
                renderDashboard(data.loja);
                loadStoreStats();
            } else {
                // Usuário não tem loja - mostrar mensagem
                showNoStoreMessage();
            }

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            showNoStoreMessage();
        }
    }

    // ========== RENDERIZAR DASHBOARD COM LOJA ==========
    function renderDashboard(loja) {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="dashboard-section active" id="dashboard-content">
                <div class="dashboard-header">
                    <h1><i class="fas fa-store"></i> ${loja.nome || 'Minha Loja'}</h1>
                    <a href="/loja/${loja.id}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-external-link-alt"></i> Ver Loja
                    </a>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                        <div class="stat-value" id="pedidos-hoje">0</div>
                        <div class="stat-label">Pedidos Hoje</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-value" id="vendas-dia">R$ 0,00</div>
                        <div class="stat-label">Vendas do Dia</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-eye"></i></div>
                        <div class="stat-value" id="visualizacoes">0</div>
                        <div class="stat-label">Visualizações</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-box"></i></div>
                        <div class="stat-value" id="total-produtos">0</div>
                        <div class="stat-label">Produtos Ativos</div>
                    </div>
                </div>

                <section class="recent-orders">
                    <h2 class="section-title">Pedidos Recentes</h2>
                    <div class="table-responsive">
                        <table class="orders-table">
                            <thead>
                                <tr>
                                    <th>ID Pedido</th>
                                    <th>Cliente</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="pedidos-recentes">
                                <tr>
                                    <td colspan="6" class="text-center">Carregando pedidos...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section class="store-info-section">
                    <h2 class="section-title">Informações da Loja</h2>
                    <div class="info-grid" id="info-loja">
                        <div class="info-item">
                            <div class="info-label">Nome da Loja:</div>
                            <div class="info-value">${loja.nome || 'Não cadastrada'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">CNPJ:</div>
                            <div class="info-value">${loja.cnpj || 'Não cadastrado'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status:</div>
                            <div class="info-value">
                                <span class="status-badge ${loja.ativo ? 'status-completed' : 'status-pending'}">
                                    ${loja.ativo ? 'Ativa' : 'Inativa'}
                                </span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Produtos Cadastrados:</div>
                            <div class="info-value">${loja.quantidadeProdutos || 0}</div>
                        </div>
                    </div>
                    <div class="action-buttons" style="margin-top: 20px;">
                        <a href="/cadastro-loja?editar=true" class="btn btn-primary">
                            <i class="fas fa-edit"></i> Editar Loja
                        </a>
                        <button class="btn btn-secondary" id="btn-add-product">
                            <i class="fas fa-plus"></i> Adicionar Produto
                        </button>
                    </div>
                </section>
            </div>
        `;

        // Adicionar eventos
        document.getElementById('btn-add-product')?.addEventListener('click', function() {
            window.location.href = '/minha-loja#produtos';
        });
    }

    // ========== CARREGAR ESTATÍSTICAS ==========
    async function loadStoreStats() {
        try {
            // Aqui você pode adicionar chamadas para APIs de estatísticas
            // Por enquanto, vamos usar dados de exemplo
            document.getElementById('pedidos-hoje').textContent = '0';
            document.getElementById('vendas-dia').textContent = 'R$ 0,00';
            document.getElementById('visualizacoes').textContent = '0';
            document.getElementById('total-produtos').textContent = '0';
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // ========== MOSTRAR MENSAGEM SEM LOJA ==========
    function showNoStoreMessage() {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="empty-dashboard">
                <i class="fas fa-store-slash fa-4x"></i>
                <h2>Você ainda não tem uma loja cadastrada</h2>
                <p>Para começar a vender no marketplace, você precisa cadastrar sua loja primeiro.</p>
                <p>É rápido, gratuito e você terá acesso a milhares de clientes!</p>
                <a href="/cadastro-loja" class="btn btn-primary mt-20">
                    <i class="fas fa-store"></i> Cadastrar Minha Loja
                </a>
            </div>
        `;
    }

    // ========== INICIALIZAÇÃO ==========
    console.log('Carregando dashboard...');
    loadDashboardData();
});