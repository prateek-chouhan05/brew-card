-- Daily scan counts for the scan-bag function: one row per day per caller (a hash of the IP),
-- plus a "*" row for the total. Only the function (service role) reads or writes it.
create table if not exists public.scan_usage (
  day  date not null default current_date,
  who  text not null,
  n    int  not null default 0,
  primary key (day, who)
);
alter table public.scan_usage enable row level security;
-- no policies: the anon and authenticated roles get nothing

-- Count one scan; returns false when the caller or the whole app is over today's limit.
create or replace function public.bump_scan(p_who text, p_per int, p_total int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare mine int; total int;
begin
  insert into scan_usage(day, who, n) values (current_date, p_who, 1)
    on conflict (day, who) do update set n = scan_usage.n + 1 returning n into mine;
  insert into scan_usage(day, who, n) values (current_date, '*', 1)
    on conflict (day, who) do update set n = scan_usage.n + 1 returning n into total;
  return mine <= p_per and total <= p_total;
end $$;
revoke all on function public.bump_scan(text, int, int) from public, anon, authenticated;
grant execute on function public.bump_scan(text, int, int) to service_role;
