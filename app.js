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

// Configuração das tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let calendar = null;
let selectedDate = null;

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
        generateTimeSlots(date); // Atualizar a grade de horários
        return;
    }
    
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
        const endDateTime = new Date(selectedDateTime.getTime() + servicoInfo.duracao * 60000);

        try {
            const { data, error } = await supabase
                .from('agendamentos')
                .insert([{
                    start_time: selectedDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    cliente: nome,
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
    }
}

// Event Listeners
closeTimeModalBtn.addEventListener('click', () => {
    timeSelectModal.classList.remove('active');
});

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