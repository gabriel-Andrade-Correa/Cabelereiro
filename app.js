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

// Configuração das tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let calendar = null;

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(content => content.style.display = 'none');
        
        btn.classList.add('active');
        document.getElementById(tabId).style.display = 'block';
        
        if (tabId === 'agendamento' && calendar) {
            calendar.render();
        }
    });
});

// Máscara para telefone
const telefoneInput = document.getElementById('telefone');
telefoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = value;
    }
});

// Formulário de cadastro
const cadastroForm = document.getElementById('cadastroForm');
cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const servico = document.getElementById('servico').value;
    
    if (!nome || !telefone || !servico) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    try {
        console.log('Tentando salvar cliente:', { nome, telefone, servico_preferido: servico });
        
        const { data, error } = await supabase
            .from('clientes')
            .insert([{ 
                nome, 
                telefone,
                servico_preferido: servico
            }])
            .select();
            
        if (error) {
            console.error('Erro Supabase:', error);
            throw error;
        }
        
        console.log('Cliente salvo com sucesso:', data);
        
        alert('Cadastro realizado com sucesso! Agora você pode agendar seu horário.');
        cadastroForm.reset();
        // Muda para a aba de agendamento após o cadastro
        document.querySelector('[data-tab="agendamento"]').click();
    } catch (error) {
        console.error('Erro completo:', error);
        alert('Erro ao cadastrar: ' + error.message);
    }
});

// Modal elements
const eventModal = document.getElementById('eventModal');
const modalClientName = document.getElementById('modalClientName');
const modalService = document.getElementById('modalService');
const modalTime = document.getElementById('modalTime');
const modalPrice = document.getElementById('modalPrice');
const closeModalBtn = document.getElementById('closeModal');
const cancelAppointmentBtn = document.getElementById('cancelAppointment');

let currentEvent = null;

// Close modal when clicking outside
eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        closeModal();
    }
});

// Close modal with button
closeModalBtn.addEventListener('click', closeModal);

// Cancel appointment
cancelAppointmentBtn.addEventListener('click', async () => {
    if (currentEvent && confirm('Tem certeza que deseja cancelar este agendamento?')) {
        try {
            const { error } = await supabase
                .from('agendamentos')
                .delete()
                .match({ start_time: currentEvent.start.toISOString() });
                
            if (error) throw error;
            
            currentEvent.remove();
            closeModal();
            alert('Agendamento cancelado com sucesso!');
        } catch (error) {
            console.error('Erro ao cancelar:', error);
            alert('Erro ao cancelar o agendamento: ' + error.message);
        }
    }
});

function closeModal() {
    eventModal.classList.remove('active');
    currentEvent = null;
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}

// Configuração do calendário
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        locale: 'pt-br',
        timeZone: 'local',
        slotMinTime: '09:00:00',
        slotMaxTime: '18:00:00',
        slotDuration: '00:30:00',
        allDaySlot: false,
        weekends: true,
        hiddenDays: [0], // Domingo
        height: 'auto',
        expandRows: true,
        stickyHeaderDates: true,
        nowIndicator: true,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
            startTime: '09:00',
            endTime: '18:00',
        },
        selectable: true,
        selectMirror: true,
        select: async function(info) {
            const start = info.start;
            
            // Verificar se a data é no passado
            if (start < new Date()) {
                alert('Não é possível agendar horários no passado.');
                return;
            }
            
            // Verificar se o horário está dentro do horário comercial
            if (start.getHours() < 9 || start.getHours() >= 18) {
                alert('Por favor, selecione um horário entre 9h e 18h.');
                return;
            }

            try {
                // Verificar se já existe agendamento para este horário
                const { data: existingAppointments, error: checkError } = await supabase
                    .from('agendamentos')
                    .select('*')
                    .eq('start_time', start.toISOString());

                if (checkError) throw checkError;

                if (existingAppointments && existingAppointments.length > 0) {
                    alert('Este horário já está ocupado. Por favor, escolha outro horário.');
                    return;
                }

                // Formulário de agendamento
                const servicoSelecionado = prompt(
                    'Selecione o serviço desejado:\n' +
                    '1 - Corte de Cabelo (30min - R$ 45,00)\n' +
                    '2 - Barba (30min - R$ 35,00)\n' +
                    '3 - Corte + Barba (60min - R$ 70,00)\n' +
                    '4 - Pigmentação (60min - R$ 80,00)\n' +
                    '5 - Hidratação (30min - R$ 50,00)'
                );

                if (!servicoSelecionado) return;

                const servicos = ['corte', 'barba', 'combo', 'pigmentacao', 'hidratacao'];
                const servico = servicos[parseInt(servicoSelecionado) - 1];

                if (!servico) {
                    alert('Serviço inválido!');
                    return;
                }

                const nome = prompt('Digite seu nome:');
                if (nome) {
                    const servicoInfo = SERVICOS[servico];
                    const end = new Date(start.getTime() + servicoInfo.duracao * 60000);

                    console.log('Tentando salvar agendamento:', {
                        start_time: start.toISOString(),
                        end_time: end.toISOString(),
                        cliente: nome,
                        servico: servico
                    });

                    const { data, error } = await supabase
                        .from('agendamentos')
                        .insert([{
                            start_time: start.toISOString(),
                            end_time: end.toISOString(),
                            cliente: nome,
                            servico: servico
                        }])
                        .select();
                        
                    if (error) {
                        console.error('Erro Supabase:', error);
                        throw error;
                    }
                    
                    console.log('Agendamento salvo com sucesso:', data);
                    
                    calendar.addEvent({
                        title: `${nome} - ${servicoInfo.nome}`,
                        start: start,
                        end: end
                    });
                    
                    alert(`Horário agendado com sucesso!\nServiço: ${servicoInfo.nome}\nValor: ${servicoInfo.preco}`);
                }
            } catch (error) {
                console.error('Erro completo:', error);
                alert('Erro ao agendar: ' + error.message);
            }
        },
        eventClick: function(info) {
            currentEvent = info.event;
            const eventData = info.event.extendedProps;
            const servicoInfo = SERVICOS[eventData.servico] || SERVICOS[info.event.title.toLowerCase()];

            modalClientName.textContent = eventData.cliente || info.event.title.split(' - ')[0];
            modalService.textContent = servicoInfo.nome;
            modalTime.textContent = formatDateTime(info.event.start);
            modalPrice.textContent = servicoInfo.preco;

            eventModal.classList.add('active');
        },
        eventContent: function(arg) {
            return {
                html: `
                    <div class="fc-content">
                        <div class="fc-time">
                            <i class="fas fa-clock"></i> 
                            ${arg.timeText}
                        </div>
                    </div>
                `
            };
        }
    });
    
    calendar.render();
    
    // Carregar agendamentos existentes
    async function loadExistingAppointments() {
        try {
            console.log('Carregando agendamentos existentes...');
            
            const { data, error } = await supabase
                .from('agendamentos')
                .select('*');
                
            if (error) throw error;
            
            console.log('Agendamentos carregados:', data);
            
            data.forEach(appointment => {
                const servicoInfo = SERVICOS[appointment.servico];
                calendar.addEvent({
                    title: `${appointment.cliente} - ${servicoInfo.nome}`,
                    start: appointment.start_time,
                    end: appointment.end_time,
                    extendedProps: {
                        cliente: appointment.cliente,
                        servico: appointment.servico
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        }
    }
    
    loadExistingAppointments();
}); 