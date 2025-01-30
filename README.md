# Barbearia Miguel Magnane - Sistema de Agendamentos

Sistema web para agendamento de horários da Barbearia Miguel Magnane, desenvolvido com tecnologias modernas e interface responsiva.

## 🚀 Funcionalidades

- ✂️ Cadastro de clientes
- 📅 Agendamento de horários
- 🕒 Visualização de agenda semanal/diária
- 📱 Interface responsiva (desktop e mobile)
- 💇‍♂️ Diversos serviços disponíveis
- 🔄 Atualização em tempo real

## 💈 Serviços Disponíveis

- Corte de Cabelo (30min - R$ 45,00)
- Barba (30min - R$ 35,00)
- Corte + Barba (60min - R$ 70,00)
- Pigmentação (60min - R$ 80,00)
- Hidratação (30min - R$ 50,00)

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Supabase (Banco de dados)
- FullCalendar
- Font Awesome

## 📱 Recursos

- Design moderno e profissional
- Calendário interativo
- Modal de detalhes de agendamento
- Máscara para telefone
- Validação de dados
- Feedback visual para ações
- Prevenção de conflitos de horários

## 🔧 Configuração

1. Clone o repositório
```bash
git clone https://github.com/gabriel-Andrade-Correa/Cabelereiro.git
```

2. Configure as variáveis do Supabase em `app.js`
```javascript
const SUPABASE_URL = 'sua_url_do_supabase';
const SUPABASE_ANON_KEY = 'sua_chave_do_supabase';
```

3. Abra o arquivo `index.html` em um servidor web

## 📋 Estrutura do Banco de Dados

### Tabela: clientes
```sql
create table clientes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  telefone text not null,
  servico_preferido text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Tabela: agendamentos
```sql
create table agendamentos (
  id uuid default uuid_generate_v4() primary key,
  cliente text not null,
  servico text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## 📱 Responsividade

O sistema é totalmente responsivo e se adapta a diferentes tamanhos de tela:
- Desktop
- Tablet
- Smartphone

## 👨‍💻 Autor

Gabriel Andrade Correa

## 📄 Licença

Este projeto está sob a licença MIT. 