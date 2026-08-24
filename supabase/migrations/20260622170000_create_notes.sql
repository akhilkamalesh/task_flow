-- Create notes table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null,
  x double precision not null default 100.0,
  y double precision not null default 100.0,
  width double precision not null default 280.0,
  height double precision not null default 200.0,
  color text default 'rgba(26, 29, 36, 0.7)',
  linked_task_ids jsonb default '[]'::jsonb,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notes enable row level security;

-- Create policies
create policy "Users can view their own notes" on public.notes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own notes" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes" on public.notes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notes" on public.notes
  for delete using (auth.uid() = user_id);
