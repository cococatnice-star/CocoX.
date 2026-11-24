-- Run this once in Supabase SQL Editor after the messages table exists.
-- Reports are private to the project owner; regular users can submit but cannot read them.
create table if not exists public.message_reports (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default 'Inappropriate or unsafe message',
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

alter table public.message_reports enable row level security;
drop policy if exists "Authenticated users can submit reports" on public.message_reports;
create policy "Authenticated users can submit reports"
on public.message_reports for insert to authenticated
with check (reporter_id = auth.uid());

-- Basic server-side safety checks: no links, email addresses, or phone-number-like strings.
alter table public.messages drop constraint if exists messages_no_links;
alter table public.messages add constraint messages_no_links
  check (content !~* '(https?://|www\.)');
alter table public.messages drop constraint if exists messages_no_emails;
alter table public.messages add constraint messages_no_emails
  check (content !~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}');
alter table public.messages drop constraint if exists messages_no_phone_numbers;
alter table public.messages add constraint messages_no_phone_numbers
  check (content !~ '(?:[0-9][ .()\-]*){8,}');

-- Enforce a minimum two-second gap between messages from the same account.
create or replace function public.enforce_cocox_chat_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.messages
    where sender_id = new.sender_id
      and created_at > now() - interval '2 seconds'
  ) then
    raise exception 'Please wait a moment before sending another message.';
  end if;
  return new;
end;
$$;

drop trigger if exists cocox_chat_rate_limit on public.messages;
create trigger cocox_chat_rate_limit
before insert on public.messages
for each row execute function public.enforce_cocox_chat_rate_limit();
