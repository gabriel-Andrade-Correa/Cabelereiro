// Inicialização do Supabase
const SUPABASE_URL = 'https://ifaoecknwpxbptzlwlch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYW9lY2tud3B4YnB0emx3bGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDU0NDIsImV4cCI6MjA1MzEyMTQ0Mn0.cQCEFba1aARkuGB9cEGoLWWovtN3kJdfqYGsaqGrnOE';

// Criar o cliente Supabase corretamente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
const timeSelectModal = document.getElementById('timeSelectModal');
const closeTimeModalBtn = document.getElementById('closeTimeModal');
const selectedDateSpan = document.querySelector('.selected-date');
const timeSlots = document.querySelector('.time-slots');

// Elementos do DOM para autenticação
const adminLoginBtn = document.getElementById('adminLoginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const clientArea = document.getElementById('client-area');
const adminArea = document.getElementById('admin-area');

let calendar = null;
let selectedDate = null;

// Credenciais de admin
const ADMIN_CREDENTIALS = {
    username: 'miguel',
    password: '159753'
};

// Funções auxiliares
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

async function generateTimeSlots(date) {
    timeSlots.innerHTML = '';
    const startHour = 9;
    const endHour = 18;
    
    // Buscar agendamentos do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of ['00', '30']) {
            const timeSlot = document.createElement('button');
            const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
            
            // Verificar se o horário está ocupado
            const slotTime = new Date(date);
            slotTime.setHours(hour, parseInt(minute), 0, 0);
            
            const isOccupied = agendamentos?.some(agendamento => {
                const agendamentoStart = new Date(agendamento.start_time);
                const agendamentoEnd = new Date(agendamento.end_time);
                return slotTime >= agendamentoStart && slotTime < agendamentoEnd;
            });
            
            timeSlot.className = `time-slot ${isOccupied ? 'occupied' : ''}`;
            timeSlot.innerHTML = `
                <i class="fas fa-clock"></i>
                ${timeString}
            `;
            
            if (!isOccupied) {
                timeSlot.addEventListener('click', () => handleTimeSelection(date, timeString));
            }
            
            timeSlots.appendChild(timeSlot);
        }
    }
}

async function handleTimeSelection(date, time) {
    const [hours, minutes] = time.split(':');
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Verificar novamente se o horário ainda está disponível
    const { data: conflictingAppointments } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('start_time', selectedDateTime.toISOString());
    
    if (conflictingAppointments?.length > 0) {
        alert('Desculpe, este horário acabou de ser reservado por outro cliente.');
        generateTimeSlots(date);
        return;
    }

    // Criar e mostrar o modal de seleção de serviços
    const serviceModal = document.createElement('div');
    serviceModal.className = 'service-select-modal active';
    serviceModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-cut"></i> Selecione o Serviço</h3>
            </div>
            <div class="modal-body">
                <div class="service-grid">
                    <div class="service-card" data-service="corte">
                        <i class="fas fa-cut"></i>
                        <h4>Corte de Cabelo</h4>
                        <p class="duration">30 minutos</p>
                        <p class="price">R$ 45,00</p>
                    </div>
                    <div class="service-card" data-service="barba">
                        <i class="fas fa-razor"></i>
                        <h4>Barba</h4>
                        <p class="duration">30 minutos</p>
                        <p class="price">R$ 35,00</p>
                    </div>
                    <div class="service-card" data-service="combo">
                        <i class="fas fa-star"></i>
                        <h4>Corte + Barba</h4>
                        <p class="duration">60 minutos</p>
                        <p class="price">R$ 70,00</p>
                    </div>
                    <div class="service-card" data-service="pigmentacao">
                        <i class="fas fa-paint-brush"></i>
                        <h4>Pigmentação</h4>
                        <p class="duration">60 minutos</p>
                        <p class="price">R$ 80,00</p>
                    </div>
                    <div class="service-card" data-service="hidratacao">
                        <i class="fas fa-tint"></i>
                        <h4>Hidratação</h4>
                        <p class="duration">30 minutos</p>
                        <p class="price">R$ 50,00</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn close">Cancelar</button>
            </div>
        </div>
    `;

    document.body.appendChild(serviceModal);

    // Adicionar eventos aos cards de serviço
    const serviceCards = serviceModal.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', async () => {
            const servico = card.dataset.service;
            
            // Remover o modal de serviços
            serviceModal.remove();

            // Pedir nome do cliente
            const nome = prompt('Digite seu nome:');
            if (!nome) return;

            // Pedir telefone
            const telefone = prompt('Digite seu telefone (apenas números):');
            if (!telefone) return;

            // Validar formato do telefone (apenas números)
            if (!/^\d+$/.test(telefone)) {
                alert('Por favor, digite apenas números no telefone.');
                return;
            }

            const servicoInfo = SERVICOS[servico];
            const endDateTime = new Date(selectedDateTime.getTime() + servicoInfo.duracao * 60000);

            try {
                const { data, error } = await supabase
                    .from('agendamentos')
                    .insert([{
                        start_time: selectedDateTime.toISOString(),
                        end_time: endDateTime.toISOString(),
                        cliente: nome,
                        telefone: telefone,
                        servico: servico
                    }])
                    .select();
                    
                if (error) throw error;
                
                alert(`Horário agendado com sucesso!\nServiço: ${servicoInfo.nome}\nValor: ${servicoInfo.preco}`);
                timeSelectModal.classList.remove('active');
                calendar.refetchEvents();
            } catch (error) {
                alert('Erro ao agendar: ' + error.message);
            }
        });
    });

    // Adicionar evento ao botão de fechar
    const closeBtn = serviceModal.querySelector('.modal-btn.close');
    closeBtn.addEventListener('click', () => {
        serviceModal.remove();
    });

    // Fechar modal quando clicar fora
    serviceModal.addEventListener('click', (e) => {
        if (e.target === serviceModal) {
            serviceModal.remove();
        }
    });
}

// Event Listeners
closeTimeModalBtn.addEventListener('click', () => {
    timeSelectModal.classList.remove('active');
});

// Configuração do calendário
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        titleFormat: { 
            month: 'long',
            year: 'numeric'
        },
        dayHeaderFormat: { 
            weekday: 'short' 
        },
        height: 'auto',
        fixedWeekCount: false,
        showNonCurrentDates: true,
        dateClick: function(info) {
            const clickedDate = info.date;
            const now = new Date();
            
            // Não permite selecionar datas passadas
            if (clickedDate < now && clickedDate.toDateString() !== now.toDateString()) {
                alert('Não é possível agendar em datas passadas.');
                return;
            }
            
            // Não permite agendar aos domingos
            if (clickedDate.getDay() === 0) {
                alert('Não atendemos aos domingos.');
                return;
            }
            
            selectedDate = clickedDate;
            selectedDateSpan.textContent = formatDate(clickedDate);
            generateTimeSlots(clickedDate);
            timeSelectModal.classList.add('active');
        }
    });
    
    calendar.render();
});

// Verificar se já está logado
function checkAdminStatus() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        showAdminArea();
    } else {
        hideAdminArea();
    }
}

// Toggle formulário de login
adminLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    loginForm.classList.toggle('active');
    console.log('Toggle login form'); // Debug
});

// Fechar formulário quando clicar fora
document.addEventListener('click', (e) => {
    if (loginForm.classList.contains('active') && !loginForm.contains(e.target) && e.target !== adminLoginBtn) {
        loginForm.classList.remove('active');
        console.log('Close login form'); // Debug
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

// Mostrar área administrativa
function showAdminArea() {
    clientArea.style.display = 'none';
    adminArea.style.display = 'block';
    adminLoginBtn.style.display = 'none';
    loadAppointments();
    loadStatistics();
}

// Esconder área administrativa
function hideAdminArea() {
    clientArea.style.display = 'block';
    adminArea.style.display = 'none';
    adminLoginBtn.style.display = 'block';
    loginForm.classList.remove('active');
}

// Verificar status de admin ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus();
});

// Carregar agendamentos
async function loadAppointments() {
    try {
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('start_time', { ascending: true });
            
        if (error) throw error;
        
        const appointmentsList = document.querySelector('.appointments-list');
        appointmentsList.innerHTML = '';
        
        agendamentos.forEach(agendamento => {
            const servicoInfo = SERVICOS[agendamento.servico];
            const element = document.createElement('div');
            element.className = 'appointment-item';
            element.innerHTML = `
                <div class="appointment-info">
                    <div class="appointment-main">
                        <span class="client-name"><i class="fas fa-user"></i> ${agendamento.cliente}</span>
                        <span class="service-type"><i class="fas fa-cut"></i> ${servicoInfo.nome}</span>
                    </div>
                    <div class="appointment-details">
                        <span class="appointment-time"><i class="fas fa-clock"></i> ${formatDateTime(agendamento.start_time)}</span>
                        <span class="appointment-price"><i class="fas fa-money-bill"></i> ${servicoInfo.preco}</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn-details" onclick="showAppointmentDetails('${agendamento.id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            `;
            appointmentsList.appendChild(element);
        });
        
    } catch (error) {
        alert('Erro ao carregar agendamentos: ' + error.message);
    }
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
        if (allAppointments?.length > 0) {
            const firstAppointment = allAppointments[0];
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
        
    } catch (error) {
        alert('Erro ao carregar estatísticas: ' + error.message);
    }
}

// Função auxiliar para formatar data e hora
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

// Navegação entre views da área administrativa
const navButtons = document.querySelectorAll('.nav-btn');
const adminViews = document.querySelectorAll('.admin-view');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        
        navButtons.forEach(b => b.classList.remove('active'));
        adminViews.forEach(view => view.style.display = 'none');
        
        btn.classList.add('active');
        document.getElementById(`${viewId}-view`).style.display = 'block';
        
        if (viewId === 'list') {
            loadAppointments();
        } else if (viewId === 'stats') {
            loadStatistics();
        }
    });
});

// Mostrar detalhes do agendamento
async function showAppointmentDetails(appointmentId) {
    try {
        const { data: agendamento, error } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('id', appointmentId)
            .single();
            
        if (error) throw error;
        
        const servicoInfo = SERVICOS[agendamento.servico];
        const eventModal = document.getElementById('eventModal');
        
        // Preencher os detalhes no modal
        document.getElementById('modalClientName').textContent = agendamento.cliente;
        document.getElementById('modalService').textContent = servicoInfo.nome;
        document.getElementById('modalTime').textContent = formatDateTime(agendamento.start_time);
        document.getElementById('modalPrice').textContent = servicoInfo.preco;
        
        // Adicionar número de telefone se disponível
        const phoneElement = document.getElementById('modalPhone');
        if (phoneElement) {
            phoneElement.textContent = agendamento.telefone || 'Não informado';
            
            // Configurar botão do WhatsApp
            const whatsappBtn = document.getElementById('sendWhatsApp');
            if (whatsappBtn) {
                if (agendamento.telefone) {
                    whatsappBtn.style.display = 'flex';
                    whatsappBtn.onclick = () => {
                        const message = `Olá ${agendamento.cliente}! Confirmando seu agendamento para ${servicoInfo.nome} em ${formatDateTime(agendamento.start_time)}. Valor: ${servicoInfo.preco}`;
                        const whatsappUrl = `https://wa.me/55${agendamento.telefone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                    };
                } else {
                    whatsappBtn.style.display = 'none';
                }
            }
        }
        
        // Mostrar o modal
        eventModal.classList.add('active');
        
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
                    loadAppointments(); // Recarregar a lista
                    if (calendar) calendar.refetchEvents(); // Atualizar o calendário
                } catch (error) {
                    alert('Erro ao cancelar agendamento: ' + error.message);
                }
            }
        };
    } catch (error) {
        alert('Erro ao carregar detalhes do agendamento: ' + error.message);
    }
} 