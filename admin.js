// Inicialização do Supabase
const SUPABASE_URL = 'https://ifaoecknwpxbptzlwlch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYW9lY2tud3B4YnB0emx3bGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDU0NDIsImV4cCI6MjA1MzEyMTQ0Mn0.cQCEFba1aARkuGB9cEGoLWWovtN3kJdfqYGsaqGrnOE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Credenciais de admin
const ADMIN_CREDENTIALS = {
    username: 'miguel',
    password: '159753'
};

// Configuração dos serviços
const SERVICOS = {
    corte: {
        nome: 'Corte de Cabelo',
        duracao: 30,
        preco: 'R$ 45,00'
    },
    barba: {
        nome: 'Barba',
        duracao: 30,
        preco: 'R$ 35,00'
    },
    combo: {
        nome: 'Corte + Barba',
        duracao: 60,
        preco: 'R$ 70,00'
    },
    pigmentacao: {
        nome: 'Pigmentação',
        duracao: 60,
        preco: 'R$ 80,00'
    },
    hidratacao: {
        nome: 'Hidratação',
        duracao: 30,
        preco: 'R$ 50,00'
    }
};

// Elementos do DOM
const adminLoginBtn = document.getElementById('adminLoginBtn');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const clientArea = document.getElementById('client-area');
const adminArea = document.getElementById('admin-area');
const navButtons = document.querySelectorAll('.nav-btn');
const adminViews = document.querySelectorAll('.admin-view');
let searchInput, dateFilter, serviceFilter, appointmentsList;
let currentAppointments = [];

// Verificar se já está logado
function checkAdminStatus() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        showAdminArea();
    } else {
        hideAdminArea();
    }
}

// Mostrar área administrativa
function showAdminArea() {
    clientArea.style.display = 'none';
    adminArea.style.display = 'block';
    adminLoginBtn.style.display = 'none';
    document.getElementById('list-view').style.display = 'block';
    loadAppointments();
}

// Esconder área administrativa
function hideAdminArea() {
    clientArea.style.display = 'block';
    adminArea.style.display = 'none';
    adminLoginBtn.style.display = 'block';
    loginForm.classList.remove('active');
}

// Toggle formulário de login
adminLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    loginForm.classList.toggle('active');
});

// Fechar formulário quando clicar fora
document.addEventListener('click', (e) => {
    if (loginForm.classList.contains('active') && !loginForm.contains(e.target) && e.target !== adminLoginBtn) {
        loginForm.classList.remove('active');
    }
});

// Impedir que cliques no formulário fechem ele
loginForm.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Submeter login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('isAdmin', 'true');
        showAdminArea();
        loginForm.classList.remove('active');
        loginForm.reset();
    } else {
        alert('Usuário ou senha incorretos!');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdmin');
    hideAdminArea();
});

// Funções auxiliares
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Navegação entre views
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        
        navButtons.forEach(b => b.classList.remove('active'));
        adminViews.forEach(view => view.style.display = 'none');
        
        btn.classList.add('active');
        document.getElementById(`${viewId}-view`).style.display = 'block';
        
        if (viewId === 'calendar' && calendar) {
            calendar.render();
        } else if (viewId === 'list') {
            loadAppointments();
        } else if (viewId === 'stats') {
            loadStatistics();
        }
    });
});

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar status de admin
    checkAdminStatus();

    // Inicializar elementos
    searchInput = document.getElementById('search-input');
    dateFilter = document.getElementById('date-filter');
    serviceFilter = document.getElementById('service-filter');
    appointmentsList = document.querySelector('.appointments-list');

    // Adicionar event listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            console.log('Search input:', searchInput.value);
            filterAppointments();
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            console.log('Date filter:', dateFilter.value);
            filterAppointments();
        });
    }

    if (serviceFilter) {
        serviceFilter.addEventListener('change', () => {
            console.log('Service filter:', serviceFilter.value);
            filterAppointments();
        });
    }

    // Carregar agendamentos iniciais
    loadAppointments();
});

// Carregar agendamentos
async function loadAppointments() {
    try {
        console.log('Carregando agendamentos...');
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('start_time', { ascending: true });
            
        if (error) throw error;
        
        console.log('Agendamentos carregados:', agendamentos);
        currentAppointments = agendamentos;
        filterAppointments();
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        alert('Erro ao carregar agendamentos: ' + error.message);
    }
}

// Filtrar e exibir agendamentos
function filterAppointments() {
    if (!appointmentsList) return;
    
    let filtered = [...currentAppointments];
    
    // Aplicar filtro de pesquisa
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filtered = filtered.filter(a => 
            a.cliente.toLowerCase().includes(searchTerm) ||
            SERVICOS[a.servico].nome.toLowerCase().includes(searchTerm)
        );
    }
    
    // Aplicar filtro de data
    if (dateFilter && dateFilter.value) {
        const selectedDate = new Date(dateFilter.value);
        filtered = filtered.filter(a => {
            const appointmentDate = new Date(a.start_time);
            return appointmentDate.toDateString() === selectedDate.toDateString();
        });
    }
    
    // Aplicar filtro de serviço
    if (serviceFilter && serviceFilter.value) {
        filtered = filtered.filter(a => a.servico === serviceFilter.value);
    }
    
    // Exibir agendamentos filtrados
    appointmentsList.innerHTML = '';
    
    if (filtered.length === 0) {
        appointmentsList.innerHTML = '<p class="no-appointments">Nenhum agendamento encontrado.</p>';
        return;
    }
    
    filtered.forEach(appointment => {
        const servicoInfo = SERVICOS[appointment.servico];
        const appointmentDate = new Date(appointment.start_time);
        
        const appointmentEl = document.createElement('div');
        appointmentEl.className = 'appointment-item';
        appointmentEl.innerHTML = `
            <div class="appointment-info">
                <div class="appointment-main">
                    <span class="client-name">${appointment.cliente}</span>
                    <span class="service-type">${servicoInfo.nome}</span>
                </div>
                <div class="appointment-details">
                    <span class="appointment-time">${formatDateTime(appointment.start_time)}</span>
                    <span class="appointment-price">${servicoInfo.preco}</span>
                </div>
            </div>
            <button class="view-details-btn" onclick="showAppointmentDetails('${appointment.id}')">
                Ver Detalhes
            </button>
        `;
        
        appointmentsList.appendChild(appointmentEl);
    });
}

// Mostrar detalhes do agendamento
async function showAppointmentDetails(appointmentId) {
    const appointment = currentAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const servicoInfo = SERVICOS[appointment.servico];
    const eventModal = document.getElementById('eventModal');
    
    // Preencher os detalhes no modal
    document.getElementById('modalClientName').textContent = appointment.cliente;
    document.getElementById('modalPhone').textContent = appointment.telefone || 'Não informado';
    document.getElementById('modalService').textContent = servicoInfo.nome;
    document.getElementById('modalTime').textContent = formatDateTime(appointment.start_time);
    document.getElementById('modalPrice').textContent = servicoInfo.preco;
    
    // Mostrar o modal
    eventModal.classList.add('active');
    
    // Configurar botão do WhatsApp
    const whatsappBtn = document.getElementById('sendWhatsApp');
    if (whatsappBtn) {
        if (appointment.telefone) {
            whatsappBtn.style.display = 'flex';
            whatsappBtn.onclick = () => {
                const message = `Olá ${appointment.cliente}! Confirmando seu agendamento para ${servicoInfo.nome} em ${formatDateTime(appointment.start_time)}. Valor: ${servicoInfo.preco}`;
                const whatsappUrl = `https://wa.me/55${appointment.telefone}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            };
        } else {
            whatsappBtn.style.display = 'none';
        }
    }
    
    // Configurar botão de fechar
    const closeModalBtn = document.getElementById('closeModal');
    closeModalBtn.onclick = () => eventModal.classList.remove('active');
    
    // Configurar botão de cancelar agendamento
    const cancelAppointmentBtn = document.getElementById('cancelAppointment');
    cancelAppointmentBtn.onclick = async () => {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                const { error: deleteError } = await supabase
                    .from('agendamentos')
                    .delete()
                    .eq('id', appointmentId);
                    
                if (deleteError) throw deleteError;
                
                alert('Agendamento cancelado com sucesso!');
                eventModal.classList.remove('active');
                loadAppointments();
            } catch (error) {
                alert('Erro ao cancelar agendamento: ' + error.message);
            }
        }
    };
}

// Carregar estatísticas
async function loadStatistics() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Agendamentos de hoje
        const { data: todayAppointments } = await supabase
            .from('agendamentos')
            .select('*')
            .gte('start_time', today.toISOString())
            .lt('start_time', new Date(today.getTime() + 86400000).toISOString());
            
        document.getElementById('today-appointments').textContent = todayAppointments?.length || 0;
        
        // Total de clientes únicos
        const { data: allAppointments } = await supabase
            .from('agendamentos')
            .select('cliente');
            
        const uniqueClients = new Set(allAppointments?.map(a => a.cliente));
        document.getElementById('total-clients').textContent = uniqueClients.size;
        
        // Média diária
        const firstAppointment = allAppointments?.[0];
        if (firstAppointment) {
            const firstDate = new Date(firstAppointment.start_time);
            const days = Math.ceil((today - firstDate) / (1000 * 60 * 60 * 24)) || 1;
            const average = (allAppointments.length / days).toFixed(1);
            document.getElementById('daily-average').textContent = average;
        }
        
        // Faturamento mensal
        let monthlyRevenue = 0;
        allAppointments?.forEach(a => {
            const appointmentDate = new Date(a.start_time);
            if (appointmentDate.getMonth() === today.getMonth() &&
                appointmentDate.getFullYear() === today.getFullYear()) {
                const servicoInfo = SERVICOS[a.servico];
                monthlyRevenue += parseInt(servicoInfo.preco.replace('R$ ', '').replace(',00', ''));
            }
        });
        document.getElementById('monthly-revenue').textContent = `R$ ${monthlyRevenue},00`;
        
        // Implementar gráficos aqui se desejar usar uma biblioteca de gráficos
        
    } catch (error) {
        alert('Erro ao carregar estatísticas: ' + error.message);
    }
}

// Configuração do calendário administrativo
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('admin-calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: async function(info, successCallback, failureCallback) {
            try {
                const { data: agendamentos, error } = await supabase
                    .from('agendamentos')
                    .select('*')
                    .gte('start_time', info.start.toISOString())
                    .lte('start_time', info.end.toISOString());
                    
                if (error) throw error;
                
                const events = agendamentos.map(agendamento => {
                    const servicoInfo = SERVICOS[agendamento.servico];
                    return {
                        id: agendamento.id,
                        title: `${agendamento.cliente} - ${servicoInfo.nome}`,
                        start: agendamento.start_time,
                        end: agendamento.end_time,
                        extendedProps: {
                            cliente: agendamento.cliente,
                            servico: agendamento.servico,
                            telefone: agendamento.telefone
                        }
                    };
                });
                
                successCallback(events);
                
            } catch (error) {
                failureCallback(error);
            }
        },
        eventClick: function(info) {
            showAppointmentDetails(info.event.id);
        }
    });
    
    calendar.render();
}); 