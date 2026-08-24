-- Add recurrence columns to tasks table
alter table public.tasks 
  add column if not exists recurrence text,
  add column if not exists recurrence_end_date timestamp with time zone,
  add column if not exists recurrence_occurrence_date timestamp with time zone;
