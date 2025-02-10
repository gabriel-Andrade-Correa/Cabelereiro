-- Criar tabela de horários bloqueados
create table blocked_times (
    id uuid default uuid_generate_v4() primary key,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    is_all_day boolean default false,
    is_recurring boolean default false,
    recurrence_pattern text, -- 'weekly', 'monthly', etc.
    recurrence_day integer, -- dia da semana (0-6) ou dia do mês
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar índices para melhor performance
create index idx_blocked_times_start_time on blocked_times(start_time);
create index idx_blocked_times_end_time on blocked_times(end_time);
create index idx_blocked_times_recurring on blocked_times(is_recurring);

-- Habilitar RLS
alter table blocked_times enable row level security;

-- Políticas para blocked_times
create policy "Permitir select para todos" on blocked_times
    for select using (true);

create policy "Permitir insert para todos" on blocked_times
    for insert with check (true);

create policy "Permitir delete para todos" on blocked_times
    for delete using (true);

create policy "Permitir update para todos" on blocked_times
    for update using (true); 