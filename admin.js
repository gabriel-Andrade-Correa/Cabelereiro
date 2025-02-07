// Inicialização do Supabase
const SUPABASE_URL = 'https://ifaoecknwpxbptzlwlch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYW9lY2tud3B4YnB0emx3bGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDU0NDIsImV4cCI6MjA1MzEyMTQ0Mn0.cQCEFba1aARkuGB9cEGoLWWovtN3kJdfqYGsaqGrnOE';
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
const navButtons = document.querySelectorAll('.nav-btn');
const adminViews = document.querySelectorAll('.admin-view');
let searchInput, dateFilter, serviceFilter, appointmentsList;
let currentAppointments = [];

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

// Função de filtro
function filterAppointments() {
    console.log('Aplicando filtros...');
    console.log('Total de agendamentos:', currentAppointments.length);
    
    if (!currentAppointments || !appointmentsList) return;
    
    let filtered = [...currentAppointments];
    
    // Filtro de busca
    const searchTerm = searchInput?.value?.toLowerCase().trim();
    if (searchTerm) {
        console.log('Aplicando filtro de busca:', searchTerm);
        filtered = filtered.filter(a => 
            a.cliente.toLowerCase().includes(searchTerm) ||
            (a.telefone && a.telefone.includes(searchTerm))
        );
    }
    
    // Filtro de data
    const selectedDate = dateFilter?.value;
    if (selectedDate && selectedDate !== 'all') {
        console.log('Aplicando filtro de data:', selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (selectedDate) {
            case 'today':
                filtered = filtered.filter(a => {
                    const appointmentDate = new Date(a.start_time);
                    return appointmentDate.toDateString() === today.toDateString();
                });
                break;
                
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(a => {
                    const appointmentDate = new Date(a.start_time);
                    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
                });
                break;
                
            case 'month':
                filtered = filtered.filter(a => {
                    const appointmentDate = new Date(a.start_time);
                    return appointmentDate.getMonth() === today.getMonth() &&
                           appointmentDate.getFullYear() === today.getFullYear();
                });
                break;
        }
    }
    
    // Filtro de serviço
    const selectedService = serviceFilter?.value;
    if (selectedService && selectedService !== 'all') {
        console.log('Aplicando filtro de serviço:', selectedService);
        filtered = filtered.filter(a => a.servico === selectedService);
    }
    
    console.log('Agendamentos filtrados:', filtered.length);
    displayAppointments(filtered);
}

// Exibir agendamentos na lista
function displayAppointments(agendamentos) {
    if (!appointmentsList) return;
    
    appointmentsList.innerHTML = '';
    
    if (agendamentos.length === 0) {
        appointmentsList.innerHTML = '<div class="no-appointments">Nenhum agendamento encontrado</div>';
        return;
    }
    
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
}

// Mostrar detalhes do agendamento
async function showAppointmentDetails(appointmentId) {
    const appointment = currentAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const servicoInfo = SERVICOS[appointment.servico];
    
    document.getElementById('detail-client').textContent = appointment.cliente;
    document.getElementById('detail-phone').textContent = appointment.telefone || 'Não informado';
    document.getElementById('detail-service').textContent = servicoInfo.nome;
    document.getElementById('detail-time').textContent = formatDateTime(appointment.start_time);
    document.getElementById('detail-price').textContent = servicoInfo.preco;
    
    modal.style.display = 'flex';
    
    // Configurar botões
    cancelAppointmentBtn.onclick = () => cancelAppointment(appointmentId);
    editAppointmentBtn.onclick = () => editAppointment(appointmentId);
    sendWhatsAppBtn.onclick = () => sendWhatsAppMessage(appointment);
}

// Cancelar agendamento
async function cancelAppointment(appointmentId) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        try {
            const { error } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', appointmentId);
                
            if (error) throw error;
            
            alert('Agendamento cancelado com sucesso!');
            modal.style.display = 'none';
            loadAppointments();
            if (calendar) calendar.refetchEvents();
            
        } catch (error) {
            alert('Erro ao cancelar agendamento: ' + error.message);
        }
    }
}

// Editar agendamento
function editAppointment(appointmentId) {
    // Implementar edição de agendamento
    alert('Funcionalidade de edição em desenvolvimento');
}

// Enviar mensagem WhatsApp
function sendWhatsAppMessage(appointment) {
    const servicoInfo = SERVICOS[appointment.servico];
    const message = `Olá ${appointment.cliente}! Confirmando seu agendamento para ${servicoInfo.nome} em ${formatDateTime(appointment.start_time)}. Valor: ${servicoInfo.preco}`;
    const whatsappUrl = `https://wa.me/${appointment.telefone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

// Fechar modal
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
}); 