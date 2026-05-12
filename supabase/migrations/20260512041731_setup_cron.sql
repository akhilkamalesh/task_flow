-- Enable necessary extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the Edge Function to run every day at 8:00 AM UTC
select cron.schedule(
  'invoke-email-reminders',
  '0 8 * * *',
  $$
    select net.http_post(
      url:='https://oakrncfpgbqucdotcksq.supabase.co/functions/v1/send-email-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_dJmxectT5gnL91hr9_SGUw_-SnwZw6h"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
