-- Primeiro, vamos dropar as tabelas existentes para recriar corretamente
drop table if exists agendamentos;
drop table if exists clientes;

-- Habilitar a extensão UUID
create extension if not exists "uuid-ossp";

-- Criar tabela de clientes
create table clientes (
    id uuid default uuid_generate_v4() primary key,
    nome text not null,
    telefone text not null,
    servico_preferido text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de agendamentos
create table agendamentos (
    id uuid default uuid_generate_v4() primary key,
    cliente text not null,
    servico text not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar índices para melhor performance
create index idx_agendamentos_start_time on agendamentos(start_time);
create index idx_agendamentos_end_time on agendamentos(end_time);
create index idx_clientes_telefone on clientes(telefone);

-- Criar políticas de segurança (RLS)
alter table clientes enable row level security;
alter table agendamentos enable row level security;

-- Políticas para clientes
create policy "Permitir select para todos" on clientes
    for select using (true);

create policy "Permitir insert para todos" on clientes
    for insert with check (true);

create policy "Permitir update para todos" on clientes
    for update using (true);

-- Políticas para agendamentos
create policy "Permitir select para todos" on agendamentos
    for select using (true);

create policy "Permitir insert para todos" on agendamentos
    for insert with check (true);

create policy "Permitir delete para todos" on agendamentos
    for delete using (true);

create policy "Permitir update para todos" on agendamentos
    for update using (true); 
